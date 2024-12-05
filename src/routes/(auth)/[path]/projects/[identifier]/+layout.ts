import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params, data }) => {
    return {
        ...data,
        routes: [
            ...(await parent()).routes,
            {
                breadcrumb: true,
                meta: {
                    title: data.project.name,
                    href: `/${params.path}/projects/${params.identifier}`
                }
            }
        ]
    };
};
