import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { PageServerLoad } from './$types';
import { ApiClientTag } from '~/lib/services/api_client.server';
import { ApiError } from '~/lib/models/errors';
import type { Team } from '~/lib/models/team';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { runtime }, parent }) => {
	const data = await parent();
	const exit = await runtime.runPromiseExit(
		pipe(
			Effect.gen(function* () {
				const api = yield* ApiClientTag;
				const response = yield* api.get(`teams/${data.team.id}`, {
					query: { select: 'new(Id, Name)' }
				});
				if (!response.ok) {
					return yield* Effect.fail(new ApiError({ code: response.status + '' }));
				}
				return yield* Effect.tryPromise(() => response.json<Team>());
			}),
			Effect.catchTags({
				ApiError: (e) => Effect.fail({ code: e.code, message: e.message }),
				UnknownException: (e) => Effect.fail({ code: 'unknown', message: e.message })
			})
		)
	);

	if (Exit.isFailure(exit)) {
		const { code, message } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
		return error(500, { code, message });
	}

	return {
		team: exit.value
	};
};
