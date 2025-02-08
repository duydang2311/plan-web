import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ data, parent }) => {
    const { queryClient, workspace } = await parent();

    prefetchQuery(queryClient)(
        ['workspace-statuses', { workspaceId: workspace.id }],
        () => data.statusList
    );

    return data;
};
