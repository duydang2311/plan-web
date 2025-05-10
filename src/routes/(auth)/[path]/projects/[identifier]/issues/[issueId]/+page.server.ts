import { error, fail, redirect } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { Asset } from '~/lib/models/asset';
import type { Issue, IssueAudit } from '~/lib/models/issue';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { WorkspaceStatus } from '~/lib/models/status';
import type { Team } from '~/lib/models/team';
import type { User, UserProfile } from '~/lib/models/user';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { maybeStream } from '~/lib/utils/promise';
import { Type } from '~/lib/utils/typebox';
import { queryParams } from '~/lib/utils/url';
import { validator } from '~/lib/utils/validation';
import type { Actions, PageServerLoad } from './$types';
import {
    createFetchIssueQuery,
    createIssueAuditListQuery,
    decode,
    decodeDeleteComment,
    decodeDeleteIssue,
    decodeEditComment,
    decodeEditDescription,
    validate,
    validateDeleteComment,
    validateDeleteIssue,
    validateEditComment,
    validateEditDescription
} from './utils';

export type LocalIssue = Pick<
    Issue,
    | 'id'
    | 'createdTime'
    | 'updatedTime'
    | 'authorId'
    | 'title'
    | 'description'
    | 'orderNumber'
    | 'priority'
    | 'statusId'
> & {
    author: Pick<User, 'email'> & { profile?: Pick<UserProfile, 'name' | 'displayName' | 'image'> };
    status?: Pick<WorkspaceStatus, 'value'>;
};

export interface LocalComment {
    createdTime: string;
    updatedTime: string;
    id: string;
    content: string;
    author: {
        id: string;
        email: string;
        profile?: {
            name: string;
            displayName: string;
            image?: Partial<Asset>;
        };
    };
}

export type LocalIssueAudit = Pick<IssueAudit, 'createdTime' | 'id' | 'action' | 'data'> & {
    user: Pick<User, 'id' | 'email'> & {
        profile?: Pick<NonNullable<User['profile']>, 'name' | 'displayName' | 'image'>;
    };
};

export const load: PageServerLoad = async ({
    parent,
    url,
    locals: { runtime, user },
    isDataRequest
}) => {
    const data = await parent();
    const query = queryParams(url, {
        'edit-desc': false,
        offset: 0,
        size: 20
    });
    const exit = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`issues/${data.issue.id}`, {
                query: createFetchIssueQuery()
            })
        );
        return yield* LoadResponse.JSON(() => response.json<LocalIssue>());
    }).pipe(runtime.runPromiseExit);

    if (Exit.isFailure(exit)) {
        const { status, ...body } = LoadResponse.Failure(exit);
        return error(status, body);
    }

    const getAuditList = await fetchIssueAuditList(exit.value.id, query.offset, query.size).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalIssueAudit>()),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        page: {
            user,
            issue: exit.value,
            issueAuditList: getAuditList(),
            isEditing: query['edit-desc']
        }
    };
};

export const actions: Actions = {
    comment: async ({ request, locals: { runtime } }) => {
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* Effect.tryPromise(() => request.formData());
                    const validation = validate(decode(formData));
                    if (!validation.ok) {
                        return yield* Effect.fail({ status: 400, errors: validation.errors });
                    }

                    const api = yield* ApiClient;
                    const response = yield* api.post(`issues/${validation.data.issueId}/comments`, {
                        body: validation.data
                    });

                    if (!response.ok) {
                        if (response.status === 400) {
                            const json = yield* Effect.tryPromise(() => response.json());
                            const problemDetails = yield* validateProblemDetailsEffect(json);
                            return yield* Effect.fail({
                                status: 400,
                                errors: flattenProblemDetails(problemDetails)
                            });
                        }
                        return yield* Effect.fail({
                            status: response.status,
                            errors: { root: [response.status + ''] }
                        });
                    }

                    return yield* Effect.succeed<void>(void 0);
                }),
                Effect.catchTags({
                    ApiError: (e) => Effect.fail({ status: 400, errors: { root: [e.code] } }),
                    UnknownException: () =>
                        Effect.fail({ status: 400, errors: { root: ['unknown'] } })
                })
            )
        );

        if (Exit.isFailure(exit)) {
            const failure = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
            return fail(failure.status, {
                comment: { errors: failure.errors as Record<string, string[]> }
            });
        }
        return null;
    },
    'edit-description': async ({ request, locals: { runtime } }) => {
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* Effect.tryPromise(() => request.formData());
                    const validation = validateEditDescription(decodeEditDescription(formData));

                    if (!validation.ok) {
                        return yield* Effect.fail({ status: 400, errors: validation.errors });
                    }

                    const api = yield* ApiClient;
                    const response = yield* api.patch(`issues/${validation.data.issueId}`, {
                        body: {
                            patch: {
                                description: validation.data.description
                            }
                        }
                    });

                    if (!response.ok) {
                        if (response.status === 400) {
                            const json = yield* Effect.tryPromise(() => response.json());
                            const problem = yield* validateProblemDetailsEffect(json);
                            return yield* Effect.fail({
                                status: 400,
                                errors: flattenProblemDetails(problem)
                            });
                        }
                        return yield* Effect.fail({
                            status: 400,
                            errors: { root: [response.status + ''] }
                        });
                    }

                    return yield* Effect.succeed<void>(void 0);
                }),
                Effect.catchTags({
                    ApiError: (e) => Effect.fail({ status: 400, errors: { root: [e.code] } }),
                    UnknownException: () =>
                        Effect.fail({ status: 400, errors: { root: ['unknown'] } })
                })
            )
        );

        if (Exit.isFailure(exit)) {
            const failure = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
            return fail(failure.status, {
                editDescription: { errors: failure.errors as Record<string, string[]> }
            });
        }

        return null;
    },
    edit_comment: async ({ request, locals: { runtime } }) => {
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* Effect.tryPromise(() => request.formData());
                    const validation = validateEditComment(decodeEditComment(formData));

                    if (!validation.ok) {
                        return yield* Effect.fail({ status: 400, errors: validation.errors });
                    }

                    const api = yield* ApiClient;
                    const response = yield* api.patch(
                        `issue-audits/comments/${validation.data.id}`,
                        {
                            body: {
                                patch: {
                                    data: {
                                        content: validation.data.content
                                    }
                                }
                            }
                        }
                    );

                    if (!response.ok) {
                        if (response.status === 400) {
                            const json = yield* Effect.tryPromise(() => response.json());
                            const problem = yield* validateProblemDetailsEffect(json);
                            return yield* Effect.fail({
                                status: 400,
                                errors: flattenProblemDetails(problem)
                            });
                        }
                        return yield* Effect.fail({
                            status: 400,
                            errors: { root: [response.status + ''] }
                        });
                    }

                    return yield* Effect.succeed<void>(void 0);
                }),
                Effect.catchTags({
                    ApiError: (e) => Effect.fail({ status: 400, errors: { root: [e.code] } }),
                    UnknownException: () =>
                        Effect.fail({ status: 400, errors: { root: ['unknown'] } })
                })
            )
        );

        if (Exit.isFailure(exit)) {
            const failure = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
            return fail(failure.status, {
                editDescription: { errors: failure.errors as Record<string, string[]> }
            });
        }
        return void 0 as void;
    },
    'delete-issue': async ({ request, params, locals: { runtime } }) => {
        const exit = await Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteIssue(decodeDeleteIssue(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`issues/${validation.data.issueId}`)
            );
        }).pipe(runtime.runPromiseExit);

        if (Exit.isFailure(exit)) {
            return exit.cause.pipe(
                Cause.failureOption,
                Option.getOrElse(() => ActionResponse.UnknownError().pipe(Effect.runSync))
            );
        }

        return redirect(302, `/${params.path}/projects/${params.identifier}/issues`);
    },
    delete_comment: ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteComment(decodeDeleteComment(formData))
            );

            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`issue-audits/${validation.data.id}`)
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    edit_title: ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateEditTitle(decodeEditTitle(formData))
            );

            yield* ActionResponse.HTTP(
                (yield* ApiClient).patch(`issues/${validation.data.issueId}`, {
                    body: {
                        patch: {
                            title: validation.data.title
                        }
                    }
                })
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};

const fetchIssueAuditList = (issueId: string, offset: number, size: number) =>
    Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get('issue-audits', {
                query: createIssueAuditListQuery({ issueId, offset: 0, size: size + offset })
            })
        );

        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalIssueAudit>>());
    });

const decodeEditTitle = (formData: FormData) => {
    return {
        issueId: formData.get('issueId'),
        title: formData.get('title')
    };
};

const validateEditTitle = validator(
    Type.Object({
        issueId: Type.String(),
        title: Type.String()
    }),
    { stripLeadingSlash: true }
);
