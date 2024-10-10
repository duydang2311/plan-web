import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data, parent }) => {
    const { queryClient, workspace } = await parent();
    const queryKey = ['workspace-statuses', { workspaceId: workspace.id }];
    if (!queryClient.isFetching({ queryKey })) {
        await queryClient.prefetchQuery({ queryKey, queryFn: () => data.statusList });
    }
    return data;
};
