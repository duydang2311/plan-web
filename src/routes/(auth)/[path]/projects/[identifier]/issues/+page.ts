import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
    const { queryClient } = await parent();
    if (!queryClient.isFetching()) {
        await queryClient.prefetchQuery({
            queryKey: ['project-issues'],
            queryFn: () => data.projectIssueList
        });
    }
    return data;
};
