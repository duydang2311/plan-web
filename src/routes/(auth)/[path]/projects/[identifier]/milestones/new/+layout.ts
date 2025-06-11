import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params, parent }) => {
    const data = await parent();
    return {
        routes: [
            ...data.routes,
            {
                breadcrumb: true,
                meta: {
                    title: 'Create milestone',
                    href: `/${params.path}/projects/${params.identifier}/milestones/new`
                }
            }
        ]
    };
};
