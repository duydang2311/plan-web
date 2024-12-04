import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing';

const BASE_95_DIGITS =
    ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';

export const getRank = (prev: string | null | undefined, next: string | null | undefined) => {
    return generateKeyBetween(prev, next, BASE_95_DIGITS);
};

export const getRanks = (
    prev: string | null | undefined,
    next: string | null | undefined,
    count: number
) => generateNKeysBetween(prev, next, count, BASE_95_DIGITS);

export const compareRank = (a: string, b: string) => (a > b ? 1 : a < b ? -1 : 0);
