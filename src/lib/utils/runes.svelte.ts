import { Duration } from 'effect';
import { onDestroy, untrack } from 'svelte';
import { isPromiseLike, unwrapMaybePromise } from './promise';

export interface Loading {
    set(): void;
    unset(): void;
    get immediate(): boolean;
    get short(): boolean;
    get medium(): boolean;
    get long(): boolean;
}

export interface Ref<T> {
    get value(): T | undefined;
    set value(value: T | undefined);
}

export interface AsyncRef<T> extends Ref<T> {
    loading: Loading;
}

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

export const watch = (depsFn: () => unknown) => {
    return (fn: () => void | (() => void)) => {
        $effect(() => {
            depsFn();
            untrack(() => fn());
        });
    };
};

export const createLoading = (): Loading => {
    let status = $state.raw(0);
    let timeout: number;

    const loading = {
        set: () => {
            if (timeout || status !== 0) {
                return;
            }
            status = 0b1;
            timeout = setTimeout(() => {
                status |= 0b10;
                timeout = setTimeout(() => {
                    status |= 0b100;
                    timeout = setTimeout(() => {
                        status |= 0b1000;
                        timeout = 0;
                    }, 3000) as unknown as number;
                }, 1000) as unknown as number;
            }, 1000) as unknown as number;
        },
        unset: () => {
            if (timeout) {
                clearTimeout(timeout);
                timeout = 0;
            }
            status = 0;
        },
        get immediate() {
            return (status & 0b1) === 0b1;
        },
        get short() {
            return (status & 0b10) === 0b10;
        },
        get medium() {
            return (status & 0b100) === 0b100;
        },
        get long() {
            return (status & 0b1000) === 0b1000;
        }
    };

    return loading;
};

export const createUiStatus = () => {
    let status = $state.raw<
        { type: 'none' } | { type: 'success' } | { type: 'failure'; errors: string[] }
    >({ type: 'none' });

    const uiStatus = {
        reset: () => {
            status = { type: 'none' };
        },
        succeed: () => {
            status = { type: 'success' };
        },
        fail: (errors: string[]) => {
            status = { type: 'failure', errors };
        },
        get isNone() {
            return status.type === 'none';
        },
        get isSuccess() {
            return status.type === 'success';
        },
        get isFailure() {
            return status.type === 'failure';
        },
        get errors() {
            return status.type === 'failure' ? status.errors : undefined;
        }
    };

    return uiStatus;
};

function __createRef<T>(f: T | (() => T)): Ref<NonNullable<T>> {
    let value = $state.raw(f instanceof Function ? f() : f);
    if (f instanceof Function) {
        $effect(() => {
            const a = f();
            untrack(() => {
                value = a;
            });
        });
    }
    return {
        get value() {
            return value as NonNullable<T>;
        },
        set value(v) {
            value = v;
        }
    };
}

export const createRef = Object.assign(__createRef, {
    maybePromise: <T>(f: () => MaybePromise<T>): AsyncRef<NonNullable<T>> => {
        const value = f();
        const loading = createLoading();
        if (!isPromiseLike(value)) {
            let state = $state.raw(value);
            $effect(() => {
                unwrapMaybePromise(f())((b) => {
                    untrack(() => {
                        state = b;
                    });
                });
            });
            return {
                get value() {
                    return state as NonNullable<T>;
                },
                set value(v) {
                    state = v;
                },
                loading
            };
        }

        let state = $state.raw<T | undefined>(undefined);
        loading.set();
        unwrapMaybePromise(value)((a) => {
            state = a;
            loading.unset();
        });
        $effect(() => {
            const a = f();
            untrack(() => {
                loading.set();
                unwrapMaybePromise(a)((b) => {
                    state = b;
                    loading.unset();
                });
            });
        });
        return {
            get value() {
                return state as NonNullable<T>;
            },
            set value(v) {
                state = v;
            },
            loading
        };
    }
});
