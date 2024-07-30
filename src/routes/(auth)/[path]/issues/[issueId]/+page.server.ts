import { fail, redirect } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { Issue } from '~/lib/models/issue';
import { ApiClientTag } from '~/lib/services/api_client.server';
import type { PageServerLoad, Actions } from './$types';
import {
	decode,
	decodeDeleteIssue,
	decodeEditComment,
	decodeEditDescription,
	validate,
	validateDeleteIssue,
	validateEditComment,
	validateEditDescription
} from './utils';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { IssueComment } from '~/lib/models/issue_comment';
import { queryParams } from '~/lib/utils/url';

export const load: PageServerLoad = async ({
	params,
	url,
	isDataRequest,
	locals: { runtime, user }
}) => {
	const query = queryParams(url, { 'edit-desc': false, 'edit-comment': null as unknown as string });
	const exit = await runtime.runPromiseExit(
		pipe(
			Effect.gen(function* () {
				const api = yield* ApiClientTag;
				const response = yield* api.get(`issues/${params.issueId}`, {
					query: { select: 'CreatedTime, UpdatedTime, AuthorId, Title, Description, OrderNumber' }
				});
				if (!response.ok) {
					return yield* Effect.fail<void>(void 0);
				}
				return yield* Effect.tryPromise(() => response.json<Issue>());
			}),
			Effect.catchAll(() => Effect.fail<void>(void 0))
		)
	);

	if (Exit.isFailure(exit)) {
		return redirect(302, `/${params.path}`);
	}

	const commentList = runtime
		.runPromiseExit(
			Effect.gen(function* () {
				const api = yield* ApiClientTag;
				const response = yield* api.get(`issues/${params.issueId}/comments`, {
					query: { select: 'CreatedTime, UpdatedTime, Content, AuthorId' }
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
		commentList: isDataRequest ? commentList : await commentList,
		isEditing: query['edit-desc'],
		editingCommentId: query['edit-comment']
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

					const api = yield* ApiClientTag;
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
					UnknownException: () => Effect.fail({ status: 400, errors: { root: ['unknown'] } })
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

					const api = yield* ApiClientTag;
					const response = yield* api.patch(`issues/${validation.data.issueId}`, {
						body: {
							patch: [{ op: 'replace', path: '/Description', value: validation.data.description }]
						}
					});

					if (!response.ok) {
						if (response.status === 400) {
							const json = yield* Effect.tryPromise(() => response.json());
							const problem = yield* validateProblemDetailsEffect(json);
							return yield* Effect.fail({ status: 400, errors: flattenProblemDetails(problem) });
						}
						return yield* Effect.fail({ status: 400, errors: { root: [response.status + ''] } });
					}

					return yield* Effect.succeed<void>(void 0);
				}),
				Effect.catchTags({
					ApiError: (e) => Effect.fail({ status: 400, errors: { root: [e.code] } }),
					UnknownException: () => Effect.fail({ status: 400, errors: { root: ['unknown'] } })
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
	'edit-comment': async ({ request, params, locals: { runtime } }) => {
		const exit = await runtime.runPromiseExit(
			pipe(
				Effect.gen(function* () {
					const formData = yield* Effect.tryPromise(() => request.formData());
					const validation = validateEditComment(decodeEditComment(formData));

					if (!validation.ok) {
						return yield* Effect.fail({ status: 400, errors: validation.errors });
					}

					const api = yield* ApiClientTag;
					const response = yield* api.patch(`issue-comments/${validation.data.issueCommentId}`, {
						body: {
							patch: [{ op: 'replace', path: '/Content', value: validation.data.content }]
						}
					});

					if (!response.ok) {
						if (response.status === 400) {
							const json = yield* Effect.tryPromise(() => response.json());
							const problem = yield* validateProblemDetailsEffect(json);
							return yield* Effect.fail({ status: 400, errors: flattenProblemDetails(problem) });
						}
						return yield* Effect.fail({ status: 400, errors: { root: [response.status + ''] } });
					}

					return yield* Effect.succeed<void>(void 0);
				}),
				Effect.catchTags({
					ApiError: (e) => Effect.fail({ status: 400, errors: { root: [e.code] } }),
					UnknownException: () => Effect.fail({ status: 400, errors: { root: ['unknown'] } })
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
	'delete-issue': async ({ request, params, locals: { runtime } }) => {
		const exit = await runtime.runPromiseExit(
			pipe(
				Effect.gen(function* () {
					const formData = yield* Effect.tryPromise(() => request.formData());
					const validation = validateDeleteIssue(decodeDeleteIssue(formData));

					if (!validation.ok) {
						return yield* Effect.fail({ status: 400, errors: validation.errors });
					}

					const api = yield* ApiClientTag;
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
					UnknownException: () => Effect.fail({ status: 500, errors: { root: ['unknown'] } })
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
	}
};
