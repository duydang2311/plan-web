import { paginatedQuery, queryParams } from '~/lib/utils/url';

export const createQueryParams = (url: URL) => {
    return {
        ...paginatedQuery(
            queryParams(url, {
                page: 1,
                size: 20,
                order: null
            })
        ),
        select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,Project.Identifier,Status.Value,Status.Rank,Priority'
    };
};

export const createQueryKey = (url: URL) => {
    const queryKey: unknown[] = [
        'issues',
        { team: url.searchParams.get('team'), project: url.searchParams.get('project') }
    ];
    return queryKey;
};
