import { mapMaybePromise } from '~/lib/utils/promise';
import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';
import { createQueryKey } from './utils';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient } = await parent();

    const queryKey = createQueryKey(url);
    switch (data.tag) {
        case 'board':
            prefetchQuery(queryClient)(queryKey, () => data.page);
            break;
        default:
            prefetchQuery(queryClient)(queryKey, () =>
                mapMaybePromise(data.page)((a) => a.issueList)
            );
    }

    return data;
};
