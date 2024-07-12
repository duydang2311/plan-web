import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { Actions } from './$types';
import { decode, validate } from './utils';
import { fail, redirect } from '@sveltejs/kit';
import { ApiClientTag } from '~/lib/services/api_client.server';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';

export const actions: Actions = {
	default: async ({ request, locals: { runtime }, params }) => {
		const exit = await runtime.runPromiseExit(
			pipe(
				Effect.gen(function* () {
					const formData = yield* Effect.promise(() => request.formData());
					const input = decode(formData);
					const validation = validate(input);
					if (!validation.ok) {
						return yield* Effect.fail(fail(400, { errors: validation.errors }));
					}

					const api = yield* ApiClientTag;
					const response = yield* api.post(`teams`, {
						body: validation.data
					});
					if (!response.ok) {
						const json = yield* Effect.tryPromise(() => response.json<unknown>());
						const problem = yield* validateProblemDetailsEffect(json);
						return yield* Effect.fail(fail(400, { errors: flattenProblemDetails(problem) }));
					}

					const data = yield* Effect.tryPromise(() => response.json<{ id: string }>());
					return yield* Effect.succeed({ ...data, identifier: input.identifier });
				}),
				Effect.catchTags({
					ApiError: (e) =>
						Effect.fail(fail(500, { errors: { root: [e.code] } as Record<string, string[]> })),
					UnknownException: () =>
						Effect.fail(fail(500, { errors: { root: ['unknown'] } as Record<string, string[]> }))
				})
			)
		);

		if (Exit.isFailure(exit)) {
			return exit.cause.pipe(Cause.failureOption, Option.getOrNull);
		}
		return redirect(302, `/${params.path}/teams/${exit.value.identifier}`);
	}
};
