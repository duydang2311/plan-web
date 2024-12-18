import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data, url }) => {
    const { queryClient, workspace } = await parent();
    const view = url.searchParams.get('view');

    switch (view) {
        case 'pending':
            break;
        default:
            await queryClient.prefetchQuery({
                queryKey: [
                    'workspace-members',
                    {
                        tag: 'active',
                        workspaceId: workspace.id,
                        order: url.searchParams.get('order')
                    }
                ],
                queryFn: () => data.members
            });
            break;
    }
    return data;
};
