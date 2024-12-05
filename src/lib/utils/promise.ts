export function isPromiseLike<T>(value: unknown): value is PromiseLike<T> {
    return typeof value === 'object' && value != null && 'then' in value;
}

export function mapMaybePromise<TIn, TOut>(
    maybePromise: TIn | Promise<TIn>,
    callback: (value: TIn) => TOut
): TOut | Promise<TOut>;
export function mapMaybePromise<TIn, TOut>(
    maybePromise: TIn | PromiseLike<TIn>,
    callback: (value: TIn) => TOut
): TOut | PromiseLike<TOut>;
export function mapMaybePromise<TIn, TOut>(
    maybePromise: TIn | Promise<TIn> | PromiseLike<TIn>,
    callback: (value: TIn) => TOut
): TOut | Promise<TOut> | PromiseLike<TOut> {
    if (isPromiseLike<TIn>(maybePromise)) {
        return maybePromise.then(callback);
    } else {
        return callback(maybePromise);
    }
}

export function unwrapMaybePromise<TIn, TOut>(
    maybePromise: TIn | PromiseLike<TIn>
): (callback: (value: TIn) => TOut) => void {
    return (callback) => {
        if (isPromiseLike<TIn>(maybePromise)) {
            maybePromise.then(callback);
        } else {
            callback(maybePromise);
        }
    };
}
