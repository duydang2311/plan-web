import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async (e) => {
	const data = await e.parent();
	return {
		routes: [
			...data.routes,
			{
				breadcrumb: true,
				meta: {
					title: 'Issues',
					href: `/${e.params.path}/issues?teamId=${e.url.searchParams.get('teamId')}`
				}
			}
		]
	};
};
