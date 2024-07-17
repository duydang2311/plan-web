import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ parent, params }) => {
	const data = await parent();
	return {
		routes: [
			...data.routes,
			{
				breadcrumb: true,
				meta: {
					title: 'Create issue',
					href: `/${params.path}/teams/${params.identifier}/issues/new`
				}
			}
		]
	};
};
