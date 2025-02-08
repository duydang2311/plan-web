import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';
import { createProjectListQueryParams } from './utils';

export const load: PageLoad = async ({ parent, data, url }) => {
    const { workspace, queryClient } = await parent();

    prefetchQuery(queryClient)(
        ['projects', createProjectListQueryParams(() => ({ url, workspaceId: workspace.id }))],
        () => data.projects
    );

    return data;
};
