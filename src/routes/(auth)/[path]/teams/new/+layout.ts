import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async (e) => {
    const data = await e.parent();
    return {
        routes: [
            ...data.routes,
            {
                breadcrumb: true,
                meta: {
                    title: 'Create team',
                    href: `/${e.params.path}/teams/new`
                }
            }
        ]
    };
};
