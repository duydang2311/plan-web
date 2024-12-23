import { type PaginatedList, paginatedList } from '~/lib/models/paginatedList';
import { mapMaybePromise } from '~/lib/utils/promise';
import type { PageLoad } from './$types';
import type { LocalBoardIssue, LocalIssue } from './+page.server';
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
            await Promise.all([
                queryClient.prefetchQuery({
                    queryKey: createStatusListQueryKey(() => ({
                        workspaceId: workspace.id
                    })),
                    queryFn: () => list
                })
            ]);

            await Promise.all(
                list.items.map((a) => {
                    return queryClient.prefetchInfiniteQuery<
                        PaginatedList<LocalBoardIssue> & { nextOffset?: number }
                    >({
                        queryKey: createIssueListQueryKey(() => ({
                            projectId: project.id,
                            params: createBoardQueryParams(url),
                            statusId: a.id
                        })),
                        queryFn: () => mapMaybePromise(page.issueLists, (b) => b[a.id]),
                        initialPageParam: 0,
                        getNextPageParam: (
                            lastPage: PaginatedList<LocalBoardIssue> & { nextOffset?: number }
                        ) => lastPage?.nextOffset
                    });
                })
            );
            break;
        }
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
