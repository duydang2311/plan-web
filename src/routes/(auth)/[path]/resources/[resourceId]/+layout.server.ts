import { LoadAttempt } from '~/lib/utils/kit';
import type { LayoutServerLoad } from './$types';
import type { Resource, WorkspaceResource } from '~/lib/models/resource';

export const load: LayoutServerLoad = async ({ params, locals }) => {
    const getAttempt = await LoadAttempt.HTTP(() =>
        locals.api.get(`workspace-resources/${params.resourceId}`, {
            query: { select: 'ResourceId,Resource.Name' }
        })
    );
    LoadAttempt.Assert(getAttempt);

    const jsonAttempt = await LoadAttempt.JSON(() =>
        getAttempt.data.json<
            Pick<WorkspaceResource, 'resourceId'> & { resource: Pick<Resource, 'name'> }
        >()
    );
    LoadAttempt.Assert(jsonAttempt);

    return {
        workspaceResource: jsonAttempt.data
    };
};
