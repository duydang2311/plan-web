import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params }) => {
    return {
        routes: [
            ...(await parent()).routes,
            {
                breadcrumb: true,
                meta: {
                    title: 'Members',
                    href: `/${params.path}/projects/${params.identifier}/members`
                }
            }
        ]
    };
};
