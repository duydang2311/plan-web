import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params, data }) => {
    const { queryClient } = await parent();
    prefetchQuery(queryClient)(['profiles', { profileName: params.profileName }], () => data.user);
    return data;
};
