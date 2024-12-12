import { Duration } from 'effect';
import { onDestroy, untrack } from 'svelte';

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

export const when: (
    conditionFn: () => boolean,
    callbackFn: () => void,
    delay?: Duration.DurationInput
) => void = (conditionFn, callbackFn, delay) => {
    if (delay == null) {
        $effect(() => {
            if (conditionFn()) {
                callbackFn();
            }
        });
    } else {
        let timeout = 0;
        $effect(() => {
            if (conditionFn()) {
                if (timeout === 0) {
                    timeout = setTimeout(() => {
                        untrack(() => {
                            callbackFn();
                        });
                        timeout = 0;
                    }, Duration.toMillis(delay)) as unknown as number;
                }
            } else if (timeout !== 0) {
                clearTimeout(timeout);
                timeout = 0;
            }
        });
        onDestroy(() => {
            if (timeout !== 0) {
                clearTimeout(timeout);
                timeout = 0;
            }
        });
    }
};
