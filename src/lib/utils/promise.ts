export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
    return typeof value === 'object' && value != null && 'then' in value;
}

export function mapMaybePromise<TIn>(
    value: TIn | Promise<TIn>
): <TOut>(map: (value: TIn) => TOut | Promise<TOut>) => TOut | Promise<TOut>;
export function mapMaybePromise<TIn>(
    value: TIn | PromiseLike<TIn>
): <TOut>(map: (value: TIn) => TOut | PromiseLike<TOut>) => TOut | PromiseLike<TOut>;
export function mapMaybePromise<TIn>(value: TIn | PromiseLike<TIn> | Promise<TIn>) {
    return value instanceof Promise
        ? <TOut>(map: (value: TIn) => TOut | Promise<TOut>): TOut | Promise<TOut> => value.then(map)
        : isPromiseLike<TIn>(value)
          ? <TOut>(map: (value: TIn) => PromiseLike<TOut>): TOut | PromiseLike<TOut> =>
                value.then(map)
          : <TOut>(map: (value: TIn) => TOut): TOut => map(value);
}

export function unwrapMaybePromise<TIn>(
    maybePromise: TIn | PromiseLike<TIn>
): (callback: (value: TIn) => void) => void {
    return (callback) => {
        if (isPromiseLike<TIn>(maybePromise)) {
            maybePromise.then(callback);
        } else {
            callback(maybePromise);
        }
    };
}

const delayed = Symbol('delayed');
export function maybeStream<T>(promise: Promise<T>, options = { waitMs: 200 }) {
    return async (stream: boolean): Promise<() => MaybePromise<T>> => {
        if (stream) {
            return () => promise;
        }

        const resolved = await Promise.race([
            promise,
            new Promise<typeof delayed>((resolve) => setTimeout(resolve, options.waitMs, delayed))
        ]);
        return resolved === delayed ? () => promise : () => resolved;
    };
}
