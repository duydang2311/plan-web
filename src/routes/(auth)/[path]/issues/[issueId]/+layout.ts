import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, data, params }) => {
    const parentData = await parent();
    return {
        routes: [
            ...parentData.routes,
            {
                breadcrumb: true,
                meta: {
                    title: data.issue.title,
                    href: `/${params.path}/issues/${params.issueId}`
                }
            }
        ]
    };
};
