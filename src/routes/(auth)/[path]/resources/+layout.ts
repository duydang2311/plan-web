import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params: { path }, parent }) => {
    return {
        routes: [
            ...(await parent()).routes,
            {
                breadcrumb: true,
                meta: {
                    title: 'Resources',
                    href: `/${path}/resources`
                }
            }
        ]
    };
};
