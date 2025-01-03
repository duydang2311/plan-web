import { error, fail, redirect } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { NotFoundError } from '~/lib/models/errors';
import type { IssuePriority } from '~/lib/models/issue';
import type { IssueComment } from '~/lib/models/issue_comment';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { Actions, PageServerLoad } from './$types';
import {
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

interface Issue {
    id: string;
    createdTime: string;
    updatedTime: string;
    authorId: string;
    title: string;
    description?: string;
    orderNumber: number;
    priority: IssuePriority;
    statusId?: string;
    status?: {
        value: string;
    };
}

export const load: PageServerLoad = async ({
    parent,
    params,
    url,
    isDataRequest,
    locals: { runtime, user }
}) => {
    const data = await parent();
    const query = queryParams(url, {
        'edit-desc': false
    });
    const exit = await Effect.gen(function* () {
        const isId = params.issueId.length === 22;
        if (!isId && isNaN(Number(params.issueId))) {
            return yield* Effect.fail(NotFoundError.instance);
        }

        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(
                isId
                    ? `issues/${params.issueId}`
                    : `workspaces/${data.workspace.id}/issues/orderNumber/${params.issueId}`,
                {
                    query: {
                        select: 'CreatedTime,UpdatedTime,Id,AuthorId,Title,Description,OrderNumber,Priority,Status.Id,Status.Value,Status.Icon'
                    }
                }
            )
        );
        return yield* LoadResponse.JSON(() => response.json<Issue>());
    }).pipe(
        Effect.catchTags({
            NotFoundError: (e) =>
                Effect.fail({
                    _tag: e._tag,
                    status: 400,
                    code: 'not_found',
                    message: 'Could not find issue.'
                } as const)
        }),
        runtime.runPromiseExit
    );

    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(
            exit.cause,
            Cause.failureOption,
            Option.getOrElse(() => Effect.runSync(LoadResponse.UnknownError()))
        );
        return error(status, body);
    }

    const commentQuery = paginatedQuery(
        queryParams(url, {
            offset: 0,
            size: 10
        })
    );

    const commentList = runtime
        .runPromiseExit(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get(`issues/${exit.value.id}/comments`, {
                    query: {
                        offset: 0,
                        size: commentQuery.offset + commentQuery.size,
                        select: 'CreatedTime,UpdatedTime,Id,Content,AuthorId'
                    }
                });
                if (!response.ok) {
                    return yield* Effect.succeed(paginatedList<IssueComment>());
                }
                return yield* Effect.tryPromise(() => response.json<PaginatedList<IssueComment>>());
            })
        )
        .then((exit) => (Exit.isSuccess(exit) ? exit.value : paginatedList<IssueComment>()));

    return {
        user,
        issue: exit.value,
        isAuthor: exit.value.authorId === user.id,
        comment: {
            query: commentQuery,
            list: isDataRequest ? commentList : await commentList
        },
        isEditing: query['edit-desc']
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

        return { comment: { success: true } };
    },
    'edit-description': async ({ request, params, locals: { runtime } }) => {
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

        return redirect(302, `/${params.path}/issues/${params.issueId}`);
    },
    'edit-comment': async ({ request, locals: { runtime } }) => {
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
                        `issue-comments/${validation.data.issueCommentId}`,
                        {
                            body: {
                                patch: {
                                    content: validation.data.content
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
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* Effect.tryPromise(() => request.formData());
                    const validation = validateDeleteIssue(decodeDeleteIssue(formData));

                    if (!validation.ok) {
                        return yield* Effect.fail({ status: 400, errors: validation.errors });
                    }

                    const api = yield* ApiClient;
                    const response = yield* api.delete(`issues/${validation.data.issueId}`);

                    if (!response.ok) {
                        return yield* Effect.fail({
                            status: response.status,
                            errors: { root: [response.status + ''] }
                        });
                    }

                    return yield* Effect.succeed<void>(void 0);
                }),
                Effect.catchTags({
                    ApiError: (e) => Effect.fail({ status: 500, errors: { root: [e.code] } }),
                    UnknownException: () =>
                        Effect.fail({ status: 500, errors: { root: ['unknown'] } })
                })
            )
        );

        if (Exit.isFailure(exit)) {
            const failure = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
            return fail(failure.status, {
                editDescription: { errors: failure.errors as Record<string, string[]> }
            });
        }

        return redirect(302, `/${params.path}`);
    },
    'delete-comment': async ({ request, locals: { runtime } }) => {
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* Effect.tryPromise(() => request.formData());
                    const validation = validateDeleteComment(decodeDeleteComment(formData));

                    if (!validation.ok) {
                        return yield* Effect.fail({ status: 400, errors: validation.errors });
                    }

                    const api = yield* ApiClient;
                    const response = yield* api.delete(
                        `issue-comments/${validation.data.issueCommentId}`
                    );

                    if (!response.ok) {
                        return yield* Effect.fail({
                            status: response.status,
                            errors: { root: [response.status + ''] }
                        });
                    }

                    return yield* Effect.succeed<void>(void 0);
                }),
                Effect.catchTags({
                    ApiError: (e) => Effect.fail({ status: 500, errors: { root: [e.code] } }),
                    UnknownException: () =>
                        Effect.fail({ status: 500, errors: { root: ['unknown'] } })
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
    }
};
