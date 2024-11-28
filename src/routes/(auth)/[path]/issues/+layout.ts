import { stringifyQuery } from '~/lib/utils/url';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, url, params }) => {
    const parentData = await parent();
    return {
        routes: [
            ...parentData.routes,
            {
                breadcrumb: true,
                meta: {
                    title: 'Issues',
                    href: `/${params.path}/issues${stringifyQuery(
                        {
                            team: url.searchParams.get('team'),
                            project: url.searchParams.get('project')
                        },
                        { includeQuestionMark: true }
                    )}`
                }
            }
        ]
    };
};
