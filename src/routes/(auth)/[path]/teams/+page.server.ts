import { Effect, Exit } from 'effect';
import type { PageServerLoad } from './$types';
import { ApiClientTag } from '~/lib/services/api_client.server';
import type { Team } from '~/lib/models/team';

export const load: PageServerLoad = async ({ locals: { runtime } }) => {
	const exit = await runtime.runPromiseExit(
		Effect.gen(function* () {
			const api = yield* ApiClientTag;
			const response = yield* api.get('teams', {
				query: { size: 3, select: 'new(CreatedTime, UpdatedTime, Name, Identifier)' }
			});
			return yield* Effect.promise(() =>
				response.json<{
					items: Team[];
					totalCount: number;
				}>()
			);
		})
	);
	if (Exit.isSuccess(exit)) {
		return { teams: exit.value };
	}
};
