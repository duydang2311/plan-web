import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ data, params }) => {
    return {
        ...data,
        routes: [
            {
                breadcrumb: true,
                meta: {
                    title: data.workspace.name,
                    href: `/${params.path}`
                }
            }
        ]
    };
};
