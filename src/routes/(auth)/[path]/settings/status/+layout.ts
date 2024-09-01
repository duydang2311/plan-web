import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params: { path }, parent }) => {
    const data = await parent();
    return {
        routes: [
            ...data.routes,
            {
                breadcrumb: true,
                meta: {
                    title: 'Status',
                    href: `/${path}/settings/status`
                }
            }
        ]
    };
};
