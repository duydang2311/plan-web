import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';
import {
    createTeamInvitationListQueryKey,
    createTeamInvitationListQueryParams,
    createUserQueryKey,
    createUserQueryParams
} from './utils';

export const load: PageLoad = async ({ parent, data }) => {
    const { queryClient } = await parent();

    if (data.user) {
        const prefetch = prefetchQuery(queryClient);
        prefetch(
            createTeamInvitationListQueryKey(() => ({
                userId: data.user.id,
                params: createTeamInvitationListQueryParams()
            })),
            () => data.teamInvitationList
        );
        prefetch(['workspaces', { userId: data.user.id }], () => data.workspaceList);
        prefetch(
            createUserQueryKey(() => ({
                userId: data.user.id,
                params: createUserQueryParams()
            })),
            () => data.user
        );
    }

    return data;
};
