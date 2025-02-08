import { unwrapMaybePromise } from '~/lib/utils/promise';
import { prefetchQuery } from '~/lib/utils/query';
import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { PageLoad } from './$types';
import { createFetchIssueAuditListQuery } from './utils';

export const load: PageLoad = async ({ parent, data, url }) => {
    const { queryClient } = await parent();
    const prefetch = prefetchQuery(queryClient);
    const commentQuery = paginatedQuery(
        queryParams(url, {
            offset: 0,
            size: 10
        })
    );

    unwrapMaybePromise(data.page.comment.list)((a) => {
        prefetch(['comments', { issueId: data.page.issue.id, size: commentQuery.size }], () => ({
            pageParams: [0],
            pages: [a]
        }));
    });
    prefetch(
        ['workspace-status', { issueId: data.page.issue.id }],
        () => data.page.issue.status ?? null
    );
    prefetch(['priority', { issueId: data.page.issue.id }], () => data.page.issue.priority);
    prefetch(['issues', { issueId: data.page.issue.id }], () => data.page.issue);
    prefetch(
        ['issues', { issueId: data.page.issue.id, tag: 'select-team' }],
        () => data.page.issue.teams
    );
    prefetch(
        ['issues', { issueId: data.page.issue.id, tag: 'select-assignees' }],
        () => data.page.issue.assignees
    );
    prefetch(
        ['issue-audits', createFetchIssueAuditListQuery(() => ({ issueId: data.page.issue.id }))],
        () => data.page.issueAuditList
    );

    return data;
};
