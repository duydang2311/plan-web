import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
    const { queryClient } = await parent();
    if (!queryClient.isFetching({ queryKey: ['workspace-members'] })) {
        await queryClient.prefetchQuery({
            queryKey: ['workspace-members'],
            queryFn: () => data.members
        });
    }

    return data;
};
