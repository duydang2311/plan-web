import { mapMaybePromise } from '~/lib/utils/promise';
import type { PageLoad } from './$types';
import { createQueryKey } from './utils';
import { paginatedList } from '~/lib/models/paginatedList';
import type { LocalIssue } from './+page.server';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { project, queryClient } = await parent();

    const queryKey = createQueryKey(url)();
    switch (data.page.tag) {
        case 'board':
            await queryClient.prefetchQuery({
                queryKey,
                queryFn: () => mapMaybePromise(data.page.streamed, (a) => a)
            });
            break;
        default:
            await queryClient.prefetchQuery({
                queryKey: [
                    'issues',
                    {
                        layout: 'table',
                        params: {
                            projectId: project.id,
                            offset: 0,
                            size: 20,
                            order: 'OrderNumber'
                        }
                    }
                ],
                queryFn: () =>
                    data.page.tag === 'table'
                        ? mapMaybePromise(data.page.streamed, (a) => a.issueList)
                        : paginatedList<LocalIssue>()
            });
    }

    return data;
};
