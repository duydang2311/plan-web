import type { PageLoad } from './$types';
import { createIssueListQueryParams, createProjectQueryParams } from './utils';

export const load: PageLoad = async ({ parent, data }) => {
    const { queryClient } = await parent();
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ['projects', { id: data.project.id, ...createProjectQueryParams() }],
            queryFn: () => data.project
        }),
        queryClient.prefetchQuery({
            queryKey: [
                'issues',
                createIssueListQueryParams(() => ({ projectId: data.project.id }))
            ],
            queryFn: () => data.issueList
        }),
        queryClient.prefetchQuery({
            queryKey: ['project-team-metadata', { projectId: data.project.id }],
            queryFn: () => data.teamMetadata
        }),
        queryClient.prefetchQuery({
            queryKey: ['project-member-metadata', { projectId: data.project.id }],
            queryFn: () => data.memberMetadata
        })
    ]);
    return data;
};
