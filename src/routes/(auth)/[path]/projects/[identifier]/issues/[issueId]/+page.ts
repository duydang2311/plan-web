import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, data }) => {
    const { queryClient } = await parent();
    const prefetch = prefetchQuery(queryClient);

    prefetch(
        ['workspace-status', { issueId: data.page.issue.id }],
        () => data.page.issue.status ?? null
    );
    prefetch(['priority', { issueId: data.page.issue.id }], () => data.page.issue.priority);

    return data;
};
