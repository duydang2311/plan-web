import { Effect, Exit } from 'effect';
import type { PageServerLoad } from './$types';
import { ApiClientTag } from '~/lib/services/api_client.server';
import type { Team } from '~/lib/models/team';
import type { PaginatedList } from '~/lib/models/paginatedList';

export const load: PageServerLoad = async ({ locals: { runtime }, url }) => {
	const exit = await runtime.runPromiseExit(
		Effect.gen(function* () {
			const api = yield* ApiClientTag;
			const response = yield* api.get('teams', {
				query: {
					select: 'new(CreatedTime, UpdatedTime, Name, Identifier)',
					size: url.searchParams.get('size'),
					order: url.searchParams.get('order')
				}
			});
			return yield* Effect.promise(() => response.json<PaginatedList<Team>>());
		})
	);
	return { teams: Exit.isSuccess(exit) ? exit.value : { totalCount: 0, items: [] } };
};
