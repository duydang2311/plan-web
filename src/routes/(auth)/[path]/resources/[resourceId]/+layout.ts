import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params, data }) => {
    return {
        routes: [
            ...(await parent()).routes,
            {
                breadcrumb: true,
                meta: {
                    title: data.workspaceResource.resource.name,
                    href: `/${params.path}/resources/${data.workspaceResource.resourceId}`
                }
            }
        ]
    };
};
