import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient } = await parent();
    if (!queryClient.isFetching()) {
        switch (url.searchParams.get('show')) {
            case 'pending':
                await queryClient.prefetchQuery({
                    queryKey: ['team-invitations', { teamId: data.team.id }],
                    queryFn: () => data.teamInvitationList!
                });
                break;
            default:
                await queryClient.prefetchQuery({
                    queryKey: ['team-members', { teamId: data.team.id }],
                    queryFn: () => data.teamMemberList!
                });
                break;
        }
    }
    return data;
};
