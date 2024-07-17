import { fail, redirect } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClientTag } from '~/lib/services/api_client.server';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import type { Actions } from './$types';
import { decode, validate } from './utils';

export const actions: Actions = {
	default: async ({ request, locals: { runtime }, params }) => {
		const exit = await runtime.runPromiseExit(
			pipe(
				Effect.gen(function* () {
					const formData = yield* Effect.tryPromise(() => request.formData());
					const input = validate(decode(formData));
					if (!input.ok) {
						return yield* Effect.fail(fail(400, { errors: input.errors }));
					}

					const api = yield* ApiClientTag;
					const response = yield* api.post('issues', {
						body: input.data
					});

					if (response.status === 400) {
						const obj = yield* Effect.tryPromise(() => response.json());
						const problem = yield* validateProblemDetailsEffect(obj);
						return yield* Effect.fail(fail(400, { errors: flattenProblemDetails(problem) }));
					}

					if (!response.ok) {
						return yield* Effect.fail(fail(400, { errors: { root: [response.status + ''] } }));
					}

					return yield* Effect.tryPromise(() => response.json<{ id: string }>());
				}),
				Effect.catchTags({
					ApiError: (a) => Effect.fail(fail(400, { errors: { root: [a.code] } })),
					UnknownException: () => Effect.fail(fail(400, { errors: { root: ['unknown'] } }))
				})
			)
		);

		if (Exit.isFailure(exit)) {
			return pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
		}

		return redirect(302, `/${params.path}/issues/${exit.value.id}`);
	}
};
