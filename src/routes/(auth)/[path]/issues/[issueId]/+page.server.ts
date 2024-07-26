import { fail, redirect, type Actions } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { Issue } from '~/lib/models/issue';
import { ApiClientTag } from '~/lib/services/api_client.server';
import type { PageServerLoad } from './$types';
import { decode, validate } from './utils';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { IssueComment } from '~/lib/models/issue_comment';

export const load: PageServerLoad = async ({ params, isDataRequest, locals: { runtime } }) => {
	const exit = await runtime.runPromiseExit(
		pipe(
			Effect.gen(function* () {
				const api = yield* ApiClientTag;
				const response = yield* api.get(`issues/${params.issueId}`, {
					query: { select: 'CreatedTime, UpdatedTime, Title, Description, OrderNumber' }
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
					query: { select: 'CreatedTime, UpdatedTime, Content' }
				});
				if (!response.ok) {
					return yield* Effect.succeed(paginatedList<IssueComment>());
				}
				return yield* Effect.tryPromise(() => response.json<PaginatedList<IssueComment>>());
			})
		)
		.then((exit) => (Exit.isSuccess(exit) ? exit.value : paginatedList<IssueComment>()));

	return {
		issue: exit.value,
		commentList: isDataRequest ? commentList : await commentList
	};
};

export const actions: Actions = {
	default: async ({ request, locals: { runtime } }) => {
		const exit = await runtime.runPromiseExit(
			pipe(
				Effect.gen(function* () {
					const formData = yield* Effect.tryPromise(() => request.formData());
					const validation = validate(decode(formData));
					if (!validation.ok) {
						return yield* Effect.fail(fail(400, { errors: validation.errors }));
					}

					const api = yield* ApiClientTag;
					const response = yield* api.post(`issues/${validation.data.issueId}/comments`, {
						body: validation.data
					});

					if (!response.ok) {
						if (response.status === 400) {
							const json = yield* Effect.tryPromise(() => response.json());
							const problemDetails = yield* validateProblemDetailsEffect(json);
							return yield* Effect.fail(
								fail(400, { errors: flattenProblemDetails(problemDetails) })
							);
						}
						return yield* Effect.fail(
							fail(response.status, { errors: { root: [response.status + ''] } })
						);
					}

					return yield* Effect.succeed<void>(void 0);
				}),
				Effect.catchTags({
					ApiError: (e) => Effect.fail(fail(400, { errors: { root: [e.code] } })),
					UnknownException: () => Effect.fail(fail(400, { errors: { root: ['unknown'] } }))
				})
			)
		);

		if (Exit.isFailure(exit)) {
			return pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
		}

		return { success: true };
	}
};
