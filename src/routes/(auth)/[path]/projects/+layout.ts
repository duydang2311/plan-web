import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params: { path }, parent }) => {
    const data = await parent();
    return {
        routes: [
            ...data.routes,
            {
                breadcrumb: true,
                meta: {
                    title: 'Projects',
                    href: `/${path}/projects`
                }
            }
        ]
    };
};