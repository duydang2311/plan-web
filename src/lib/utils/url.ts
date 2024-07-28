export function queryParams<T extends Record<string, unknown>>(
	input: URL | URLSearchParams,
	defaultValues: T
): T {
	if (input instanceof URL) {
		input = input.searchParams;
	}
	const obj: T = { ...defaultValues };
	for (const k in obj) {
		let value: string | number | boolean | null = input.get(k);
		if (typeof defaultValues[k] === 'boolean') {
			if (value != null) {
				obj[k] = (value === 'false' ? false : true) as T[Extract<keyof T, string>];
			}
			continue;
		}

		if (value) {
			if (typeof defaultValues[k] === 'number') {
				value = Number(value);
			}
			obj[k] = value as T[Extract<keyof T, string>];
		} else if (obj[k] == null) {
			// eslint-disable-next-line @typescript-eslint/no-dynamic-delete
			delete obj[k];
		}
	}
	return obj;
}

export function paginatedQuery<T extends { page: number; size: number }>(queryParams: T) {
	return {
		...queryParams,
		offset: (queryParams.page - 1) * queryParams.size
	};
}
