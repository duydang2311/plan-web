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
        }
    }
    return data;
};
