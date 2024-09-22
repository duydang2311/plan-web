import { untrack } from 'svelte';

export const createEffect: ((fn: () => void | (() => void), depsFn?: () => unknown) => void) & {
    pre: (fn: () => void | (() => void), depsFn?: () => unknown) => void;
} = Object.assign(
    (fn: () => void | (() => void), depsFn?: () => unknown) => {
        $effect(() => {
            depsFn?.();
            return untrack(fn);
        });
    },
    {
        pre: (fn: () => void | (() => void), depsFn?: () => unknown) => {
            $effect.pre(() => {
                depsFn?.();
                untrack(fn);
            });
        }
    }
);

export const createAsyncEffect: (fn: () => MaybePromise<unknown>, depsFn?: () => unknown) => void =
    Object.assign((fn: () => MaybePromise<unknown>, depsFn?: () => unknown) => {
        let resolved: false | null = null;
        $effect(() => {
            depsFn?.();
            if (resolved === false) {
                return;
            }
            const ret = untrack(fn) as Promise<void>;
            if (!(ret instanceof Promise)) {
                return;
            }
            resolved = false;
            ret.finally(() => (resolved = null));
        });
    });
