import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data, url }) => {
    const { queryClient } = await parent();
    if (!queryClient.isFetching()) {
        if (url.searchParams.get('layout') === 'board') {
            await queryClient.prefetchQuery({
                queryKey: ['issues', { layout: 'board' }],
                queryFn: async () => {
                    return await data.board!;
                }
            });
        } else {
            await queryClient.prefetchQuery({
                queryKey: ['issues'],
                queryFn: async () => {
                    return await data.issueList!;
                }
            });
        }
    }
    return data;
};
