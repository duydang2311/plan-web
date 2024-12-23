interface DeeplyFind {
    <T1 extends unknown[]>(
        arr: T1
    ): (predicate: (a: T1[number]) => boolean) => T1[number] | undefined;
    <T1 extends unknown[], T2 extends unknown[]>(
        arr: T1,
        select1: (a: T1[number]) => T2
    ): (predicate: (a: T2[number]) => boolean) => T2[number] | undefined;
    <T1 extends unknown[], T2 extends unknown[], T3 extends unknown[]>(
        arr: T1,
        select1: (a: T1[number]) => T2,
        select2: (a: T2[number]) => T3
    ): (predicate: (a: T3[number]) => boolean) => T3[number] | undefined;
}

interface DeeplyFindIndex {
    <T1 extends unknown[]>(arr: T1): (predicate: (a: T1[number]) => boolean) => number;
    <T1 extends unknown[], T2 extends unknown[]>(
        arr: T1,
        select1: (a: T1[number]) => T2
    ): (predicate: (a: T2[number]) => boolean) => number;
    <T1 extends unknown[], T2 extends unknown[], T3 extends unknown[]>(
        arr: T1,
        select1: (a: T1[number]) => T2,
        select2: (a: T2[number]) => T3
    ): (predicate: (a: T3[number]) => boolean) => number;
}

export const deeplyFind: DeeplyFind = (
    arr: unknown[],
    ...mapFuncs: ((a: unknown) => unknown[])[]
) => {
    return (predicate: (a: unknown) => boolean) => {
        for (let a of arr) {
            for (const map of mapFuncs) {
                a = map(a);
            }
            for (const b of a as unknown[]) {
                if (predicate(b)) {
                    return b;
                }
            }
        }
    };
};

export const deeplyFindIndex: DeeplyFindIndex = (
    arr: unknown[],
    ...mapFuncs: ((a: unknown) => unknown[])[]
) => {
    return (predicate: (a: unknown) => boolean) => {
        for (let a of arr) {
            for (const map of mapFuncs) {
                a = map(a);
            }
            let index = 0;
            for (const b of a as unknown[]) {
                if (predicate(b)) {
                    return index;
                }
                ++index;
            }
        }
        return -1;
    };
};
