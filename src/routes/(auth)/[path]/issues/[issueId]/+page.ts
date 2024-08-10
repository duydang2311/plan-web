import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data, url, params }) => {
    const { queryClient } = await parent();
    const commentQuery = paginatedQuery(
        queryParams(url, {
            offset: 0,
            size: 10
        })
    );

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

    return data;
};
