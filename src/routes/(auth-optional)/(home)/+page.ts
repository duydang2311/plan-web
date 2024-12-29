import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
    const { queryClient } = await parent();

    if (data.user) {
        await queryClient.prefetchQuery({
            queryKey: ['team-invitations'],
            queryFn: () => data.teamInvitationList
        });

        await queryClient.prefetchQuery({
            queryKey: ['workspaces', { userId: data.user.id }],
            queryFn: () => data.workspaceList
        });
    }
    return data;
};
