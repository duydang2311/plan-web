import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';
import { pendingMembersParams, workspaceMembersParams } from './utils';

export const load: PageLoad = async ({ parent, data, url }) => {
    const { queryClient, workspace } = await parent();
    const view = url.searchParams.get('view');

    switch (view) {
        case 'pending':
            prefetchQuery(queryClient)(
                [
                    'workspace-invitations',
                    {
                        tag: 'pending',
                        params: pendingMembersParams({ url, workspaceId: workspace.id })
                    }
                ],
                () => data.invitationList
            );
            break;
        default:
            prefetchQuery(queryClient)(
                [
                    'workspace-members',
                    {
                        tag: 'active',
                        workspaceId: workspace.id,
                        params: workspaceMembersParams({ url })
                    }
                ],
                () => data.memberList
            );
            break;
    }
    return data;
};
