import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient } = await parent();
    if (!queryClient.isFetching()) {
        switch (url.searchParams.get('show')) {
            case 'pending':
                prefetchQuery(queryClient)(
                    ['team-invitations', { teamId: data.team.id }],
                    () => data.teamInvitationList!
                );
                break;
            default:
                prefetchQuery(queryClient)(
                    ['team-members', { teamId: data.team.id }],
                    () => data.teamMemberList!
                );
                break;
        }
    }
    return data;
};
