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
                offset: 0,
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
                tag: 'issues-board',
                project: project ?? url.searchParams.get('project'),
                layout: layout ?? (url.searchParams.get('layout') === 'board' ? 'board' : 'table'),
                params: {
                    offset: 0,
                    limit: 10,
                    order: 'OrderNumber',
                    select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,Project.Identifier,Status.Value,Status.Rank,Priority'
                }
            }
        ] as const;
    };

export const createIssueListQueryParams = ({
    projectId,
    url,
    ...rest
}: { projectId: string; url?: URL } & Record<string, unknown>) => {
    return {
        projectId,
        page: rest.page ?? Number(url?.searchParams.get('page') ?? '1'),
        size: rest.size ?? Number(url?.searchParams.get('size') ?? '20'),
        order: rest.order ?? url?.searchParams.get('order') ?? 'OrderNumber',
        select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,Project.Identifier,Status.Value,Status.Rank,Priority'
    };
};
