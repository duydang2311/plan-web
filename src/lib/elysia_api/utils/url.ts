export function queryParamsDict<T extends Record<string, unknown>>(
    dict: Record<string, string | undefined>,
    defaultValues: T
): T {
    const obj: T = { ...defaultValues };
    for (const k in obj) {
        let value: number | boolean | string | undefined = dict[k];
        if (typeof defaultValues[k] === 'boolean') {
            if (value != null) {
                obj[k] = (value === 'false' ? false : true) as T[Extract<keyof T, string>];
            }
            continue;
        }

        if (value != null) {
            if (typeof defaultValues[k] === 'number') {
                value = Number(value);
                if (isNaN(value)) {
                    value = defaultValues[k];
                }
            }
            obj[k] = value as T[Extract<keyof T, string>];
        } else if (obj[k] == null) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete obj[k];
        }
    }
    return obj;
}
