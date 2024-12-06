import { paginatedQuery, queryParams } from '~/lib/utils/url';

export const createQueryParams = (url: URL) => {
    return {
        ...paginatedQuery(
            queryParams(url, {
                page: 1,
                size: 20
            })
        ),
        select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,Project.Identifier,Status.Value,Status.Rank,Priority',
        order: 'OrderNumber'
    };
};

export const createBoardQueryParams = (url: URL) => {
    return {
        ...paginatedQuery(
            queryParams(url, {
                page: 1,
                size: 20
            })
        ),
        select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,StatusId,StatusRank',
        order: 'StatusRank,OrderNumber'
    };
};

export const createQueryKey =
    (url: URL) =>
    ({ project, layout }: { project?: string; layout?: string } = {}) => {
        return [
            'issues',
            {
                project: project ?? url.searchParams.get('project'),
                layout: layout ?? (url.searchParams.get('layout') === 'board' ? 'board' : 'table')
            }
        ] as const;
    };