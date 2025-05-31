import { error, fail, redirect } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe, type Context } from 'effect';
import type { Asset } from '~/lib/models/asset';
import { ChecklistItemKind, type ChecklistItem } from '~/lib/models/checklist';
import type { Issue, IssueAudit } from '~/lib/models/issue';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { Project } from '~/lib/models/project';
import type { WorkspaceStatus } from '~/lib/models/status';
import type { User, UserProfile } from '~/lib/models/user';
import { ApiClient } from '~/lib/services/api_client.server';
import type { HttpClient } from '~/lib/services/http_client';
import { ActionAttempt, ActionResponse, LoadAttempt, LoadResponse } from '~/lib/utils/kit';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { maybeStream } from '~/lib/utils/promise';
import { attempt } from '~/lib/utils/try';
import { Type } from '~/lib/utils/typebox';
import { queryParams } from '~/lib/utils/url';
import { validator } from '~/lib/utils/validation';
import type { Actions, PageServerLoad } from './$types';
import type { LocalMilestone } from './types';
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
    | 'startTime'
    | 'endTime'
    | 'timelineZone'
> & {
    author: Pick<User, 'email'> & { profile?: Pick<UserProfile, 'name' | 'displayName' | 'image'> };
    status?: Pick<WorkspaceStatus, 'value'>;
    milestone?: LocalMilestone;
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

export type LocalChecklistItem = OneOf<Pick<ChecklistItem, 'id'>, { optimisticId: string }> &
    Pick<ChecklistItem, 'kind' | 'content' | 'completed'> & {
        subIssue?: Pick<Issue, 'title' | 'orderNumber'> & {
            project: Pick<Project, 'identifier'>;
            status?: Pick<WorkspaceStatus, 'value' | 'category'>;
        };
    };

export const load: PageServerLoad = async ({
    parent,
    url,
    locals,
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

    const getChecklistStream = await pipe(
        getChecklist(locals.api)(data.issue.id).then(attempt.mapError((e) => e.code)),
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        page: {
            user,
            issue: exit.value,
            issueAuditList: getAuditList(),
            isEditing: query['edit-desc']
        },
        getChecklist: getChecklistStream()
    };
};

const getChecklist =
    (httpClient: Context.Tag.Service<HttpClient>) => async (parentIssueId: string) => {
        const getAttempt = await LoadAttempt.HTTP(() =>
            httpClient.get('checklist-items', {
                query: {
                    parentIssueId,
                    select: 'Id,Kind,Content,Completed,SubIssue.Project.Identifier,SubIssue.OrderNumber,SubIssue.Title,SubIssue.Status.Value,SubIssue.Status.Category',
                    order: 'Id'
                }
            })
        );
        if (getAttempt.failed) {
            return getAttempt;
        }
        return await LoadAttempt.JSON(() =>
            getAttempt.data.json<PaginatedList<LocalChecklistItem>>()
        );
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
    edit_title: async ({ request, locals: { runtime } }) => {
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
    },
    add_checklist_item: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validation = validateAddChecklistItem(decodeAddChecklistItem(formDataAttempt.data));
        if (!validation.ok) {
            return ActionAttempt.Validation(validation);
        }

        const createAttempt = await ActionAttempt.HTTP(() =>
            locals.api.post('checklist-items', {
                body: {
                    parentIssueId: validation.data.parentIssueId,
                    kind: validation.data.kind,
                    content: validation.data.content,
                    subIssueId: validation.data.subIssueId
                }
            })
        );
        if (createAttempt.failed) {
            return ActionAttempt.Failure(createAttempt);
        }

        const jsonAttempt = await ActionAttempt.JSON(() =>
            createAttempt.data.json<Pick<ChecklistItem, 'id'>>()
        );
        if (jsonAttempt.failed) {
            return ActionAttempt.Failure(jsonAttempt);
        }
        return jsonAttempt.data;
    },
    delete_checklist_item: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validation = validateDeleteChecklistItem(
            decodeDeleteChecklistItem(formDataAttempt.data)
        );
        if (!validation.ok) {
            return ActionAttempt.Validation(validation);
        }

        const deleteAttempt = await ActionAttempt.HTTP(() =>
            locals.api.delete(`checklist-items/${validation.data.id}`)
        );
        if (deleteAttempt.failed) {
            return ActionAttempt.Failure(deleteAttempt);
        }
    },
    patch_checklist_item: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validation = validatePatchChecklistItem(
            decodePatchChecklistItem(formDataAttempt.data)
        );
        if (!validation.ok) {
            return ActionAttempt.Validation(validation);
        }

        const patchAttempt = await ActionAttempt.HTTP(() =>
            locals.api.patch(`checklist-items/${validation.data.id}`, {
                body: {
                    patch: validation.data.patch
                }
            })
        );
        if (patchAttempt.failed) {
            return ActionAttempt.Failure(patchAttempt);
        }
    },
    create_checklist_item_todo_batch: async ({ request, locals }) => {
        const formDataAttempt = await ActionAttempt.FormData(() => request.formData());
        if (formDataAttempt.failed) {
            return ActionAttempt.Failure(formDataAttempt);
        }

        const validation = validateAddChecklistItemTodoBatch(
            decodeAddChecklistItemTodoBatch(formDataAttempt.data)
        );
        if (!validation.ok) {
            return ActionAttempt.Validation(validation);
        }

        const createAttempt = await ActionAttempt.HTTP(() =>
            locals.api.post(`checklist-items/batch`, {
                body: {
                    parentIssueId: validation.data.parentIssueId,
                    contents: validation.data.contents
                }
            })
        );
        if (createAttempt.failed) {
            return ActionAttempt.Failure(createAttempt);
        }
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

const decodeAddChecklistItem = (formData: FormData) => {
    return {
        parentIssueId: formData.get('parentIssueId'),
        kind: formData.get('kind'),
        content: formData.get('content'),
        subIssueId: formData.get('subIssueId')
    };
};

const validateAddChecklistItem = validator(
    Type.Object({
        parentIssueId: Type.String(),
        kind: Type.Union([
            Type.Literal(ChecklistItemKind.Todo),
            Type.Literal(ChecklistItemKind.SubIssue)
        ]),
        content: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        subIssueId: Type.Optional(Type.Union([Type.String(), Type.Null()]))
    }),
    { stripLeadingSlash: true, convert: true }
);

const decodeDeleteChecklistItem = (formData: FormData) => {
    return {
        id: formData.get('id')
    };
};

const validateDeleteChecklistItem = validator(
    Type.Object({
        id: Type.String()
    }),
    { stripLeadingSlash: true }
);

const decodePatchChecklistItem = (formData: FormData) => {
    return {
        id: formData.get('id'),
        patch: {
            content: formData.get('content')
        }
    };
};

const validatePatchChecklistItem = validator(
    Type.Object(
        {
            id: Type.String(),
            patch: Type.Object({
                content: Type.Optional(Type.Union([Type.String(), Type.Null()]))
            })
        },
        { additionalProperties: false }
    ),
    { stripLeadingSlash: true, convert: true }
);

const decodeAddChecklistItemTodoBatch = (formData: FormData) => {
    return {
        parentIssueId: formData.get('parentIssueId'),
        contents: formData.getAll('contents').filter((a) => typeof a === 'string' && a.length > 0)
    };
};

const validateAddChecklistItemTodoBatch = validator(
    Type.Object(
        {
            parentIssueId: Type.String(),
            contents: Type.Array(Type.String(), { minItems: 1 })
        },
        { additionalProperties: false }
    ),
    { stripLeadingSlash: true }
);
