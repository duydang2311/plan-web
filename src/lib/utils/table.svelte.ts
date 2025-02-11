import { goto, replaceState } from '$app/navigation';
import type { PaginatedList } from '../models/paginatedList';
import { fluentSearchParams } from './url';

export type BaseField = string;
export type SortDirection = 'asc' | 'desc' | null;

interface CreateSortOptions {
    fields?: string | Record<BaseField, SortField>;
    onDirectionChange?: (sort: Sort) => void;
}

interface CreatePaginationOptions {
    page?: number;
    rowsPerPage?: number;
    size?: number;
    totalCount?: number;
    syncUrl?: () => URL;
    syncList?: () => PaginatedList<unknown>;
}

export interface Sort {
    get string(): string | null;

    field<Field extends BaseField>(
        field: Field,
        options?: { direction?: SortDirection }
    ): SortField<Field>;
}

export interface SortField<Field extends BaseField = BaseField> {
    readonly field: Field;
    get direction(): SortDirection;
    set direction(value);
    toggle(): void;
}

export interface PaginationHandler {
    get page(): number;
    set page(value: number);
    get rowsPerPage(): number;
    set rowsPerPage(value: number);
    get size(): number;
    set size(value: number);
    get totalCount(): number;
    set totalCount(value: number);

    sync(list: () => PaginatedList<unknown> | null | undefined): PaginationHandler;
}

export const createSort = ({ fields, onDirectionChange }: CreateSortOptions = {}): Sort => {
    const onFieldDirectionChange = (sortField: SortField) => {
        const index = queue.indexOf(sortField);
        if (sortField.direction === null) {
            if (index !== -1) {
                queue.splice(queue.indexOf(sortField), 1);
            }
        } else if (index === -1) {
            queue.push(sortField);
        }

        sortString =
            queue.length === 0
                ? null
                : queue.map((a) => `${a.direction === 'desc' ? '-' : ''}${a.field}`).join(',');
        onDirectionChange?.(sort);
    };
    const __createSortField = createSortField({ onDirectionChange: onFieldDirectionChange });
    const queue: SortField[] = [];

    const sort: Sort = {
        get string() {
            return sortString;
        },
        field<Field extends BaseField>(field: Field, options?: { direction?: SortDirection }) {
            sortFields[field] ??= __createSortField(field, options);
            return sortFields[field] as SortField<Field>;
        }
    };

    if (typeof fields === 'string') {
        fields = Object.fromEntries(
            fields
                .trim()
                .split(',')
                .map((a) => {
                    if (a[0] === '-') {
                        const field = a.substring(1);
                        const sortField = __createSortField(field, { direction: 'desc' });
                        queue.push(sortField);
                        return [field, sortField];
                    }
                    const sortField = __createSortField(a, { direction: 'asc' });
                    queue.push(sortField);
                    return [a, sortField];
                })
        );
    } else if (fields == null) {
        fields = {};
    }

    const sortFields: Record<BaseField, SortField> = fields;
    let sortString = $state.raw<string | null>(
        queue.length === 0
            ? null
            : queue.map((a) => `${a.direction === 'desc' ? '-' : ''}${a.field}`).join(',')
    );

    return sort;
};

export const createPagination = (options?: CreatePaginationOptions): PaginationHandler => {
    let initialPage = options?.page ?? 1;
    let initialRowsPerPage = options?.rowsPerPage ?? 20;
    let initialSize = 0;
    let initialTotalCount = 0;

    if (options?.syncUrl) {
        const url = options.syncUrl();
        initialPage = paginationHelper.page(url);
        initialRowsPerPage = paginationHelper.rowsPerPage(url);
        $effect(() => {
            const url = options.syncUrl!();
            page = paginationHelper.page(url);
            rowsPerPage = paginationHelper.rowsPerPage(url);
        });
    }

    if (options?.syncList) {
        const list = options.syncList();
        initialSize = list.items.length;
        initialTotalCount = list.totalCount;

        $effect(() => {
            const list = options.syncList!();
            size = list.items.length;
            totalCount = list.totalCount;
        });
    }

    let page = $state.raw(initialPage);
    let rowsPerPage = $state.raw(initialRowsPerPage);
    let size = $state.raw(initialSize);
    let totalCount = $state.raw(initialTotalCount);

    const handler: PaginationHandler = {
        get page() {
            return page;
        },
        set page(value) {
            page = value;
        },
        get rowsPerPage() {
            return rowsPerPage;
        },
        set rowsPerPage(value) {
            rowsPerPage = value;
        },
        get size() {
            return size;
        },
        set size(value) {
            size = value;
        },
        get totalCount() {
            return totalCount;
        },
        set totalCount(value) {
            totalCount = value;
        },
        sync: (list) => {
            const l = list();
            size = l?.items.length ?? 0;
            totalCount = l?.totalCount ?? 0;
            $effect(() => {
                const l = list();
                size = l?.items.length ?? 0;
                totalCount = l?.totalCount ?? 0;
            });
            return handler;
        }
    };

    return handler;
};

const createSortField =
    ({ onDirectionChange }: { onDirectionChange: (sortField: SortField) => void }) =>
    <Field extends BaseField>(
        field: Field,
        { direction: initialDirection }: { direction?: SortDirection } = {}
    ): SortField<Field> => {
        let direction = $state.raw<SortDirection>(
            initialDirection === undefined ? null : initialDirection
        );
        const sortField: SortField<Field> = {
            field,
            get direction() {
                return direction;
            },
            set direction(value) {
                direction = value;
                onDirectionChange(sortField);
            },
            toggle() {
                direction = direction == null ? 'asc' : direction === 'asc' ? 'desc' : null;
                onDirectionChange(sortField);
            }
        };
        return sortField;
    };

export const sortHelper: {
    replaceState: (url: URL) => (sort: Sort) => void;
    goto: (
        url: URL,
        opts: Parameters<(typeof import('$app/navigation'))['goto']>[1]
    ) => (sort: Sort) => void;
} = {
    replaceState: (url: URL) => (sort: Sort) => {
        const searchParams = fluentSearchParams(url);
        if (sort.string == null) {
            searchParams.delete('order');
        } else {
            searchParams.set('order', sort.string);
        }
        replaceState(`${url.pathname}${searchParams.toString()}`, {});
    },
    goto: (url, opts) => (sort: Sort) => {
        const searchParams = fluentSearchParams(url);
        if (sort.string == null) {
            searchParams.delete('order');
        } else {
            searchParams.set('order', sort.string);
        }
        goto(`${url.pathname}${searchParams.toString()}`, opts);
    }
};

export const paginationHelper = {
    createPagination: (url: URL, options?: { size?: number; totalCount?: number }) => {
        return createPagination({
            page: paginationHelper.page(url),
            rowsPerPage: paginationHelper.rowsPerPage(url),
            size: options?.size,
            totalCount: options?.totalCount
        });
    },
    page: (url: URL) => {
        const page = Number(url.searchParams.get('page') ?? '1');
        return isNaN(page) ? 1 : page;
    },
    rowsPerPage: (url: URL) => {
        const rowsPerPage = Number(url.searchParams.get('size') ?? '20');
        return isNaN(rowsPerPage) ? 20 : rowsPerPage;
    }
};
