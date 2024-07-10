import type { LayoutLoad } from './$types';

export const load: LayoutLoad = ({ data }) => {
	return {
		...data,
		routes: [
			{
				breadcrumb: true,
				meta: {
					title: data.workspace.name,
					href: `/${data.workspace.name}`
				}
			}
		]
	};
};
