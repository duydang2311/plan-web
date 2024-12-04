import { mapMaybePromise } from '~/lib/utils/promise';
import type { PageLoad } from './$types';
import { createQueryKey } from './utils';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { queryClient } = await parent();

    const queryKey = createQueryKey(url);
    switch (data.tag) {
        case 'board':
            await queryClient.prefetchQuery({
                queryKey,
                queryFn: () => mapMaybePromise(data.page, (a) => a)
            });
            break;
        default:
            await queryClient.prefetchQuery({
                queryKey,
                queryFn: () => mapMaybePromise(data.page, (a) => a.issueList)
            });
    }

    return data;
};
