import type { PageLoad } from './$types';
import { pendingMembersParams, workspaceMembersParams } from './utils';

export const load: PageLoad = async ({ parent, data, url }) => {
    const { queryClient, workspace } = await parent();
    const view = url.searchParams.get('view');

    switch (view) {
        case 'pending':
            await queryClient.prefetchQuery({
                queryKey: [
                    'workspace-invitations',
                    {
                        tag: 'pending',
                        params: pendingMembersParams({ url, workspaceId: workspace.id })
                    }
                ],
                queryFn: () => data.invitationList
            });
            break;
        default:
            await queryClient.prefetchQuery({
                queryKey: [
                    'workspace-members',
                    {
                        tag: 'active',
                        workspaceId: workspace.id,
                        params: workspaceMembersParams({ url })
                    }
                ],
                queryFn: () => data.memberList
            });
            break;
    }
    return data;
};
