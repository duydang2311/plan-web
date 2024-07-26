import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { LayoutServerLoad } from './$types';
import { ApiClientTag } from '~/lib/services/api_client.server';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ params, locals: { runtime } }) => {
	const exit = await runtime.runPromiseExit(
		pipe(
			Effect.gen(function* () {
				const api = yield* ApiClientTag;
				const response = yield* api.get(`issues/${params.issueId}`, {
					query: { select: 'Title' }
				});

				if (!response.ok) {
					return yield* Effect.fail({
						status: response.status,
						code: response.status + '',
						message: 'Could not retrieve the requested issue'
					});
				}

				return yield* Effect.tryPromise(() => response.json<{ title: string }>());
			}),
			Effect.catchTags({
				ApiError: (e) =>
					Effect.fail({
						status: 500,
						code: e.code,
						message: 'Could not retrieve the requested issue'
					}),
				UnknownException: () =>
					Effect.fail({
						status: 500,
						code: 'unknown',
						message: 'Could not retrieve the requested issue'
					})
			})
		)
	);

	if (Exit.isFailure(exit)) {
		const failure = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
		return error(failure.status, failure);
	}
	return {
		issue: exit.value
	};
};
