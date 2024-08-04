import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, parent, params }) => {
    const parentData = await parent();
    return {
        team: data.team,
        routes: [
            ...parentData.routes,
            {
                breadcrumb: true,
                meta: {
                    title: data.team.name,
                    href: `/${params.path}/teams/${data.team.identifier}`
                }
            }
        ]
    };
};
