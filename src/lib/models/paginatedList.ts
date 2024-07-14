export interface PaginatedList<T> {
	items: T[];
	size: number;
	offset: number;
	totalCount: number;
}

export function paginatedList<T>(options?: {
	items?: T[];
	size?: number;
	offset?: number;
	totalCount?: number;
}): PaginatedList<T> {
	const { items, size, offset, totalCount } = options ?? {};
	return {
		items: items ?? [],
		size: size ?? 0,
		offset: offset ?? 0,
		totalCount: totalCount ?? 0
	};
}
