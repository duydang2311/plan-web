import type { PageLoad } from './$types';
import { createProjectMemberListQueryParams } from './utils';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient, project } = await parent();

    await queryClient.prefetchQuery({
        queryKey: [
            'project-members',
            createProjectMemberListQueryParams(() => ({
                projectId: project.id,
                url
            }))
        ],
        queryFn: () => data.memberList
    });

    return data;
};
