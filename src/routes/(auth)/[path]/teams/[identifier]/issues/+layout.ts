import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ params: { path, identifier }, parent }) => {
	const data = await parent();
	return {
		routes: [
			...data.routes,
			{
				breadcrumb: true,
				meta: {
					title: 'Issues',
					href: `/${path}/teams/${identifier}/issues`
				}
			}
		]
	};
};
