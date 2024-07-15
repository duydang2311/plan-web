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
		if (value) {
			if (typeof defaultValues[k] === 'number') {
				value = Number(value);
			}
			if (typeof defaultValues[k] === 'boolean') {
				value = value === 'true' ? true : false;
			}
			obj[k] = value as T[Extract<keyof T, string>];
		}
	}
	return obj;
}
