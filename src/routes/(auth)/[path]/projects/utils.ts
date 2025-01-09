import { Type } from '~/lib/utils/typebox';
import { paginatedQuery, queryParamsStrict } from '~/lib/utils/url';
import { validator } from '~/lib/utils/validation';

export const validateActionFailureData = validator(
    Type.Object({
        errors: Type.Object({
            root: Type.Array(Type.String())
        })
    })
);

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
