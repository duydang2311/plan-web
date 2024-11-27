import type { PageLoad } from './$types';
import { createQueryKey } from './utils';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient } = await parent();

    await queryClient.prefetchQuery({
        queryKey: createQueryKey(url),
        queryFn: () => data.issueList
    });

    return data;
};
