import { paginatedList } from '~/lib/models/paginatedList';
import { unwrapMaybePromise } from '~/lib/utils/promise';
import { prefetchQuery } from '~/lib/utils/query';
import type { PageLoad } from './$types';
import { createIssueListQueryKey, createStatusListQueryKey } from './_board/utils';
import { createBoardQueryParams } from './utils';

export const load: PageLoad = async ({ parent, url, data }) => {
    const { workspace, project, queryClient } = await parent();

    switch (data.page.tag) {
        case 'board': {
            const statusList = await data.page.statusList;
            const list = paginatedList({
                items: [{ id: -1, value: 'No status' }, ...statusList.items],
                totalCount: statusList.totalCount + 1
            });
            const page = data.page;
            prefetchQuery(queryClient)(
                createStatusListQueryKey(() => ({
                    workspaceId: workspace.id
                })),
                () => list
            );

            unwrapMaybePromise(page.issueLists)((a) => {
                for (const b of list.items) {
                    prefetchQuery(queryClient)(
                        createIssueListQueryKey(() => ({
                            projectId: project.id,
                            params: createBoardQueryParams(url),
                            statusId: b.id
                        })),
                        () => ({
                            pageParams: [0],
                            pages: [a[b.id]]
                        })
                    );
                }
            });
            break;
        }
    }

    return data;
};
