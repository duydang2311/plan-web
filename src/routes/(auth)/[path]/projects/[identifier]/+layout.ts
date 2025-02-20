import {
    IconHome,
    IconHomeSolid,
    IconIssues,
    IconIssuesOutline,
    IconUsers,
    IconUsersSolid
} from '~/lib/components/icons';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params, data }) => {
    return {
        ...data,
        routes: [
            ...(await parent()).routes,
            {
                breadcrumb: true,
                meta: {
                    title: data.project.name,
                    href: `/${params.path}/projects/${params.identifier}`,
                    navigation: {
                        label: `Project · ${data.project.name}`,
                        entries: [
                            {
                                label: 'Overview',
                                href: `/${params.path}/projects/${params.identifier}`,
                                icon: IconHome,
                                activeIcon: IconHomeSolid
                            },
                            {
                                label: 'Issues',
                                href: `/${params.path}/projects/${params.identifier}/issues`,
                                icon: IconIssuesOutline,
                                activeIcon: IconIssues
                            },
                            {
                                label: 'Members',
                                href: `/${params.path}/projects/${params.identifier}/members`,
                                icon: IconUsers,
                                activeIcon: IconUsersSolid
                            }
                        ]
                    }
                }
            }
        ]
    };
};
