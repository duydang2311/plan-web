import { Effect, Exit } from 'effect';
import type { PageServerLoad } from './$types';
import { ApiClient } from '~/lib/services/api_client.server';
import type { Team } from '~/lib/models/team';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { paginatedQuery, queryParams } from '~/lib/utils/url';

export const load: PageServerLoad = async ({ isDataRequest, parent, locals: { runtime }, url }) => {
    const data = await parent();
    const query = paginatedQuery(
        queryParams(url, {
            workspaceId: data.workspace.id,
            page: 1,
            size: 20,
            order: '',
            select: 'new(CreatedTime, UpdatedTime, Name, Identifier)'
        })
    );

    const teamList = runtime
        .runPromiseExit(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get('teams', {
                    query
                });
                return yield* Effect.promise(() => response.json<PaginatedList<Team>>());
            })
        )
        .then((exit) => (Exit.isSuccess(exit) ? exit.value : paginatedList<Team>()))
        .then((v) => ({ ...v, size: query.size, offset: query.offset }));

    return { teamList: isDataRequest ? teamList : await teamList };
};
