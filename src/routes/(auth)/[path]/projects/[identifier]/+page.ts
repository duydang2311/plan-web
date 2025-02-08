import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';
import { createIssueListQueryParams, createProjectQueryParams } from './utils';

export const load: PageLoad = async ({ parent, data }) => {
    const { queryClient } = await parent();
    const prefetch = prefetchQuery(queryClient);
    prefetch(
        ['projects', { id: data.project.id, ...createProjectQueryParams() }],
        () => data.project
    );
    prefetch(
        ['issues', createIssueListQueryParams(() => ({ projectId: data.project.id }))],
        () => data.issueList
    );
    prefetch(['project-team-metadata', { projectId: data.project.id }], () => data.teamMetadata);
    prefetch(
        ['project-member-metadata', { projectId: data.project.id }],
        () => data.memberMetadata
    );
    return data;
};
