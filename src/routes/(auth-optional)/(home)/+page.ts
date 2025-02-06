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
        await Promise.all([
            queryClient.prefetchQuery({
                queryKey: createTeamInvitationListQueryKey(() => ({
                    userId: data.user.id,
                    params: createTeamInvitationListQueryParams()
                })),
                queryFn: () => data.teamInvitationList
            }),
            queryClient.prefetchQuery({
                queryKey: ['workspaces', { userId: data.user.id }],
                queryFn: () => data.workspaceList
            }),
            queryClient.prefetchQuery({
                queryKey: createUserQueryKey(() => ({
                    userId: data.user.id,
                    params: createUserQueryParams()
                })),
                queryFn: () => data.user
            })
        ]);
    }

    return data;
};
