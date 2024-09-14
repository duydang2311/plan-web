import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
    const { queryClient } = await parent();
    if (!queryClient.isFetching({ queryKey: ['projects'] })) {
        await queryClient.prefetchQuery({
            queryKey: ['projects'],
            queryFn: () => data.projects
        });
    }

    return data;
};
