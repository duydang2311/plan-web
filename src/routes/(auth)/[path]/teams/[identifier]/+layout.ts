import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, parent }) => {
	const parentData = await parent();
	return {
		routes: [
			...parentData.routes,
			{
				breadcrumb: true,
				meta: {
					title: data.team.name,
					href: `/${data.team.name}`
				}
			}
		]
	};
};
