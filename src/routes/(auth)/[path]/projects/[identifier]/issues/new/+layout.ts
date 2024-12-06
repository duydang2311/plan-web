import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params }) => {
    return {
        routes: [
            ...(await parent()).routes,
            {
                breadcrumb: true,
                meta: {
                    title: 'Create issue',
                    href: `/${params.path}/projects/${params.identifier}/issues/new`
                }
            }
        ]
    };
};