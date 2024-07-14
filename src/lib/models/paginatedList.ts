export interface PaginatedList<T> {
	items: T[];
	totalCount: number;
}

export function paginatedList<T>({
	items,
	totalCount
}: {
	items: T[];
	totalCount?: number;
}): PaginatedList<T> {
	return {
		items,
		totalCount: totalCount ?? items.length
	};
}
