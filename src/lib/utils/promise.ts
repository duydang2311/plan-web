export function mapMaybePromise<TIn, TOut>(
    maybePromise: TIn | Promise<TIn>,
    callback: (value: TIn) => TOut
): TOut | Promise<TOut> {
    if (maybePromise instanceof Promise) {
        return maybePromise.then(callback);
    } else {
        return callback(maybePromise);
    }
}
