import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, data }) => {
    const { queryClient } = await parent();
    const queryKey = ['profiles', { profileName: params.profileName }];
    if (!queryClient.isFetching({ queryKey })) {
        await queryClient.prefetchQuery({ queryKey, queryFn: () => data.user });
    }
    return data;
};
