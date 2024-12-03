import { mapMaybePromise } from '~/lib/utils/promise';
import type { PageLoad } from './$types';
import { createQueryKey } from './utils';
import { prefetchQuery } from '~/lib/utils/query';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient } = await parent();

    const queryKey = createQueryKey(url);
    switch (data.tag) {
        case 'board':
            await queryClient.prefetchQuery({
                queryKey,
                queryFn: () => mapMaybePromise(data.page, (a) => a.issueLists)
            });
            break;
        default:
            await prefetchQuery(queryClient)({
                queryKey,
                queryFn: () => mapMaybePromise(data.page, (a) => a.issueList)
            });
    }

    return data;
};
