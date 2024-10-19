import clsx, { type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function isEmptyObject(object: object) {
    for (const _ in object) {
        return false;
    }
    return true;
}

export function hasProperty<T extends object>(
    object: T,
    property: string | number | symbol
): property is keyof T {
    return property in object;
}

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
