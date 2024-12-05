import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params, data }) => {
    return {
        routes: [
            ...(await parent()).routes,
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
