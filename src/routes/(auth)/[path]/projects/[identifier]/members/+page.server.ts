import { Effect } from 'effect';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import type { PageServerLoad } from './$types';
import { createProjectMemberListQueryParams, type LocalProjectMember } from './utils';

export const load: PageServerLoad = async ({ parent, url, locals: { runtime }, isDataRequest }) => {
    const data = await parent();

    const memberList = Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get('project-members', {
                query: createProjectMemberListQueryParams(() => ({
                    projectId: data.project.id,
                    url
                }))
            })
        );
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalProjectMember>>());
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalProjectMember>()),
        runtime.runPromise
    );

    return {
        memberList: isDataRequest ? memberList : await memberList
    };
};
