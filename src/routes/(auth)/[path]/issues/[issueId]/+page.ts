import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data, url, params }) => {
    const { queryClient, workspace } = await parent();
    const commentQuery = paginatedQuery(
        queryParams(url, {
            offset: 0,
            size: 10
        })
    );

    if (
        !queryClient.isFetching({
            queryKey: ['comments', { issueId: params.issueId, size: commentQuery.size }]
        })
    ) {
        await queryClient.prefetchInfiniteQuery({
            queryKey: ['comments', { issueId: params.issueId, size: commentQuery.size }],
            queryFn: async () => {
                const list = await data.comment.list;
                return {
                    ...list,
                    nextOffset: list.items.length
                };
            },
            initialPageParam: 0
        });
    }

    if (
        !queryClient.isFetching({
            queryKey: ['workspace-status', { issueId: data.issue.id }]
        })
    ) {
        await queryClient.prefetchQuery({
            queryKey: ['workspace-status', { issueId: data.issue.id }],
            queryFn: () => data.issue.status
        });
    }

    return data;
};
