import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, parent }) => {
	const parentData = await parent();
	return {
		team: data.team,
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
