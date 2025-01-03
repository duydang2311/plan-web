import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, data }) => {
    const { queryClient } = await parent();
    await queryClient.prefetchQuery({
        queryKey: ['profiles', { profileName: params.profileName }],
        queryFn: () => data.user
    });
    return data;
};
