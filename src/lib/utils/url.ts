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

export function queryParamsStrict<T extends Record<string, unknown>>(
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
                if (isNaN(value)) {
                    value = defaultValues[k];
                }
            }
            obj[k] = value as T[Extract<keyof T, string>];
        }
    }
    return obj;
}

// TODO: i might rename this to withOffset
export function paginatedQuery<T extends { page?: number; offset?: number; size?: number }>(
    queryParams: T
) {
    queryParams.page ??= 1;
    queryParams.size ??= 20;
    if (queryParams.offset == null || queryParams.offset === 0) {
        queryParams.offset = queryParams.page
            ? (queryParams.page - 1) * queryParams.size
            : (queryParams.offset ?? 0);
    }
    return {
        ...queryParams,
        offset: queryParams.offset
    };
}

export function fluentSearchParams(input: URL | URLSearchParams) {
    return new FluentSearchParams(input instanceof URL ? input.searchParams : input);
}

export const stringifyQuery = (
    record: Record<string, unknown>,
    options?: { includeQuestionMark?: boolean }
) => {
    const entries = Object.entries(record).filter(([, v]) => v != null);
    if (entries.length === 0) {
        return '';
    }

    return `${options?.includeQuestionMark ? '?' : ''}${entries
        .map(([k, v]) => `${k}=${v}`)
        .join('&')}`;
};

class FluentSearchParams {
    private _searchParams: URLSearchParams;

    public constructor(searchParams: URLSearchParams) {
        this._searchParams = new URLSearchParams(searchParams);
    }

    set(name: string, value: string) {
        this._searchParams.set(name, value);
        return this;
    }

    delete(name: string) {
        this._searchParams.delete(name);
        return this;
    }

    toString() {
        return this._searchParams.size === 0 ? '' : `?${this._searchParams.toString()}`;
    }
}
