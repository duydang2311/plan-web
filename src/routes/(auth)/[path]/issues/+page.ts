import { mapMaybePromise } from '~/lib/utils/promise';
import type { PageLoad } from './$types';
import { createQueryKey } from './utils';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient } = await parent();

    queryClient.prefetchQuery({
        queryKey: createQueryKey(url),
        queryFn: () => mapMaybePromise(data.page, (a) => a.issueList)
    });

    return data;
};
