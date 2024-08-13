import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params }) => {
    const parentData = await parent();
    return {
        routes: [
            ...parentData.routes,
            {
                breadcrumb: true,
                meta: {
                    title: 'Settings',
                    href: `/${params.path}/teams/${params.identifier}/settings`
                }
            }
        ]
    };
};
