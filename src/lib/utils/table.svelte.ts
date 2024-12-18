import { replaceState } from '$app/navigation';
import { fluentSearchParams } from './url';

export type BaseField = string;
export type SortDirection = 'asc' | 'desc' | null;

interface CreateSortOptions {
    fields?: string | Record<BaseField, SortField>;
    onDirectionChange?: (sort: Sort) => void;
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

export const sortHelper = {
    replaceState: (url: URL) => (sort: Sort) => {
        const searchParams = fluentSearchParams(url);
        if (sort.string == null) {
            searchParams.delete('order');
        } else {
            searchParams.set('order', sort.string);
        }
        replaceState(`${url.pathname}${searchParams.toString()}`, {});
    }
};
