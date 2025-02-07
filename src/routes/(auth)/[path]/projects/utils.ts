import { paginatedQuery, queryParamsStrict } from '~/lib/utils/url';

export const createProjectListQueryParams = (
    deps: () => { url: URL; workspaceId: string } & Record<string, unknown>
) => {
    const { url, workspaceId, ...rest } = deps();
    return {
        ...paginatedQuery(queryParamsStrict(url, { page: 1, size: 20, order: null })),
        workspaceId,
        ...rest
    };
};
