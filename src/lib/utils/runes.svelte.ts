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
    get value(): T;
    set value(value: T);
}

export interface AsyncRef<T> extends Ref<T> {
    readonly loading: Loading;
    readonly isInitialLoading: boolean;
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

export const watch = Object.assign(
    function (depsFn: () => unknown) {
        return (fn: () => void | (() => void)) => {
            $effect(() => {
                depsFn();
                return untrack(() => fn());
            });
        };
    },
    {
        pre(depsFn: () => unknown) {
            return (fn: () => void | (() => void)) => {
                $effect.pre(() => {
                    depsFn();
                    return untrack(() => fn());
                });
            };
        }
    }
);

export const createLoading = (): Loading => {
    return new SvelteLoading();
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

function __createRef<T>(valueOrFn: T | (() => T)): Ref<T>;
function __createRef<T>(): Ref<T | undefined>;
function __createRef<T>(valueOrFn?: T | (() => T)) {
    return new SvelteRef(valueOrFn);
}

function __createAsyncRef<T>(value: T): AsyncRef<T>;
function __createAsyncRef<T>(): AsyncRef<T | undefined>;
function __createAsyncRef<T>(value?: T) {
    return new SvelteAsyncRef(value);
}

export const createRef = Object.assign(__createRef, {
    async: __createAsyncRef,
    maybePromise: <T>(f: () => MaybePromise<T>): AsyncRef<T> => {
        const initialValue = f();
        if (!isPromiseLike(initialValue)) {
            const ref = new SvelteAsyncRef(initialValue);
            $effect.pre(() => {
                unwrapMaybePromise(f())((b) => {
                    untrack(() => {
                        ref.value = b;
                    });
                });
            });
            return ref as AsyncRef<NonNullable<T>>;
        }

        const ref = new SvelteAsyncRef<T>();
        ref.loading.set();
        unwrapMaybePromise(initialValue)((a) => {
            ref.value = a;
            ref.loading.unset();
        });
        $effect.pre(() => {
            const a = f();
            untrack(() => {
                ref.loading.set();
                unwrapMaybePromise(a)((b) => {
                    ref.value = b;
                    ref.loading.unset();
                });
            });
        });
        return ref as AsyncRef<NonNullable<T>>;
    }
});

export const createDirty = () => {
    return new Dirty();
};

class SvelteLoading {
    status = $state.raw(0);
    timeout: number | undefined = undefined;

    public set() {
        if (this.timeout || this.status !== 0) {
            return;
        }
        this.status = 0b1;
        this.timeout = setTimeout(() => {
            this.status |= 0b10;
            this.timeout = setTimeout(() => {
                this.status |= 0b100;
                this.timeout = setTimeout(() => {
                    this.status |= 0b1000;
                    this.timeout = 0;
                }, 3000) as unknown as number;
            }, 1000) as unknown as number;
        }, 1000) as unknown as number;
    }
    public unset() {
        if (this.timeout) {
            clearTimeout(this.timeout);
            this.timeout = 0;
        }
        this.status = 0;
    }
    get immediate() {
        return (this.status & 0b1) === 0b1;
    }
    get short() {
        return (this.status & 0b10) === 0b10;
    }
    get medium() {
        return (this.status & 0b100) === 0b100;
    }
    get long() {
        return (this.status & 0b1000) === 0b1000;
    }
}

class SvelteRef<T> implements Ref<T | undefined> {
    value = $state.raw<T | undefined>();
    constructor(f?: T | (() => T)) {
        if (f instanceof Function) {
            const a = f();
            this.value = a;
            $effect(() => {
                const a = f();
                untrack(() => {
                    this.value = a;
                });
            });
        } else {
            this.value = f;
        }
    }
}

class SvelteAsyncRef<T> implements AsyncRef<T | undefined> {
    value = $state.raw<T | undefined>();
    #loading = createLoading();

    constructor(initialValue?: T) {
        this.value = initialValue;
    }

    get loading() {
        return this.#loading;
    }

    get isInitialLoading() {
        return this.value == null && this.#loading.immediate;
    }
}

class Dirty {
    #dirty = false;

    set() {
        this.#dirty = true;
    }

    unset() {
        this.#dirty = false;
    }

    get isDirty() {
        return this.#dirty;
    }
}
