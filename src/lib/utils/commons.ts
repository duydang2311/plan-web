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

export const formatFileSize = (bytes: number) => {
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0 || bytes === 1) return `${bytes} byte`;
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round((bytes / Math.pow(1024, i)) * 100) / 100} ${sizes[i]}`;
};
