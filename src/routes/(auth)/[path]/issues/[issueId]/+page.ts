import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data, url, untrack, params }) => {
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
            queryKey: ['comments', { issueId: params.issueId, size: commentQuery.size }]
        })
    ) {
        prefetchPromises.push(
            queryClient.prefetchInfiniteQuery({
                queryKey: ['comments', { issueId: params.issueId, size: commentQuery.size }],
                queryFn: async () => {
                    const list = await data.comment.list;
                    return {
                        ...list,
                        nextOffset: list.items.length
                    };
                },
                initialPageParam: 0
            })
        );
    }

    if (
        !queryClient.isFetching({
            queryKey: ['workspace-status', { issueId: data.issue.id }]
        })
    ) {
        prefetchPromises.push(
            queryClient.prefetchQuery({
                queryKey: ['workspace-status', { issueId: data.issue.id }],
                queryFn: () => data.issue.status ?? null
            })
        );
    }

    if (
        !queryClient.isFetching({
            queryKey: ['priority', { issueId: data.issue.id }]
        })
    ) {
        prefetchPromises.push(
            queryClient.prefetchQuery({
                queryKey: ['priority', { issueId: data.issue.id }],
                queryFn: () => data.issue.priority
            })
        );
    }

    await Promise.all(prefetchPromises);
    return data;
};
