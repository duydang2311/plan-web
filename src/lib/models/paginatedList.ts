export interface PaginatedList<T> {
	items: T[];
	totalCount: number;
}

export function paginatedList<T>(options?: { items?: T[]; totalCount?: number }): PaginatedList<T> {
	const { items, totalCount } = options ?? {};
	return {
		items: items ?? [],
		totalCount: totalCount ?? 0
	};
}
