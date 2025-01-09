import type { PageLoad } from './$types';
import { createProjectListQueryParams } from './utils';

export const load: PageLoad = async ({ parent, data, url }) => {
    const { workspace, queryClient } = await parent();
    await queryClient.prefetchQuery({
        queryKey: [
            'projects',
            createProjectListQueryParams(() => ({ url, workspaceId: workspace.id }))
        ],
        queryFn: () => data.projects
    });

    return data;
};
