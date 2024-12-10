import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data, url, untrack }) => {
    const { queryClient } = await untrack(() => parent());
    const commentQuery = paginatedQuery(
        queryParams(
            untrack(() => url),
            {
                offset: 0,
                size: 10
            }
        )
    );

    const prefetchPromises: Promise<unknown>[] = [];

    if (
        !queryClient.isFetching({
            queryKey: ['comments', { issueId: data.page.issue.id, size: commentQuery.size }]
        })
    ) {
        prefetchPromises.push(
            queryClient.prefetchInfiniteQuery({
                queryKey: ['comments', { issueId: data.page.issue.id, size: commentQuery.size }],
                queryFn: () => data.page.comment.list,
                initialPageParam: 0
            })
        );
    }

    if (
        !queryClient.isFetching({
            queryKey: ['workspace-status', { issueId: data.page.issue.id }]
        })
    ) {
        prefetchPromises.push(
            queryClient.prefetchQuery({
                queryKey: ['workspace-status', { issueId: data.page.issue.id }],
                queryFn: () => data.page.issue.status ?? null
            })
        );
    }

    if (
        !queryClient.isFetching({
            queryKey: ['priority', { issueId: data.page.issue.id }]
        })
    ) {
        prefetchPromises.push(
            queryClient.prefetchQuery({
                queryKey: ['priority', { issueId: data.page.issue.id }],
                queryFn: () => data.page.issue.priority
            })
        );
    }

    if (
        !queryClient.isFetching({
            queryKey: ['issues', { issueId: data.page.issue.id }]
        })
    ) {
        prefetchPromises.push(
            queryClient.prefetchQuery({
                queryKey: ['issues', { issueId: data.page.issue.id }],
                queryFn: () => data.page.issue
            })
        );
    }

    prefetchPromises.push(
        queryClient.prefetchQuery({
            queryKey: ['issues', { issueId: data.page.issue.id, tag: 'select-team' }],
            queryFn: () => data.page.issue.teams
        })
    );

    await Promise.all(prefetchPromises);
    return data;
};
