export interface Success<TData> {
    ok: true;
    failed?: never;
    data: TData;
}

export interface Failure<TError> {
    ok?: never;
    failed: true;
    error: TError;
}

export type Try<TData, TError> = Attempt<TData, TError>;
export type Attempt<TData, TError> = Success<TData> | Failure<TError>;

export const tryDo = <TData>(fn: () => TData) => {
    return <TError>(mapException?: (e: unknown) => TError): Attempt<TData, TError> => {
        try {
            return attempt.ok(fn());
        } catch (e) {
            return attempt.fail(mapException ? mapException(e) : (e as TError));
        }
    };
};

export const tryPromise = <TData>(fn: () => Promise<TData>) => {
    return async <TError>(
        mapException?: (e: unknown) => TError
    ): Promise<Attempt<TData, TError>> => {
        try {
            return attempt.ok(await fn());
        } catch (e) {
            return attempt.fail(mapException ? mapException(e) : (e as TError));
        }
    };
};

interface AttemptFnMap {
    <TIn, TOut>(
        f: (data: TIn) => TOut
    ): <TError>(self: Attempt<TIn, TError>) => Attempt<TOut, TError>;
    <TIn, TError>(
        self: Attempt<TIn, TError>
    ): <TOut>(f: (data: TIn) => TOut) => Attempt<TOut, TError>;
}
const mapAttempt: AttemptFnMap = (<TIn, TOut, TError>(
    arg: ((x: TIn) => TOut) | Attempt<TIn, TError>
) => {
    if (typeof arg === 'function') {
        return (self: Attempt<TIn, TError>): Attempt<TOut, TError> => {
            if (self.ok) {
                return attempt.ok(arg(self.data));
            } else {
                return self;
            }
        };
    } else {
        return <TOut>(f: (x: TIn) => TOut): Attempt<TOut, TError> => {
            if (arg.ok) {
                return attempt.ok(f(arg.data));
            } else {
                return arg;
            }
        };
    }
}) as AttemptFnMap;

interface AttemptFnMapError {
    <TIn, TOut>(
        f: (error: TIn) => TOut
    ): <TData>(self: Attempt<TData, TIn>) => Attempt<TData, TOut>;
    <TData, TIn>(
        self: Attempt<TData, TIn>
    ): <TOut>(f: (error: TIn) => TOut) => Attempt<TData, TOut>;
}
const mapAttemptError: AttemptFnMapError = (<TData, TIn, TOut>(
    arg: ((e: TIn) => TOut) | Attempt<TData, TIn>
) => {
    if (typeof arg === 'function') {
        return (self: Attempt<TData, TIn>): Attempt<TData, TOut> => {
            if (self.ok) {
                return self;
            } else {
                return attempt.fail(arg(self.error));
            }
        };
    } else {
        return <TOut>(f: (e: TIn) => TOut): Attempt<TData, TOut> => {
            if (arg.ok) {
                return arg;
            } else {
                return attempt.fail(f(arg.error));
            }
        };
    }
}) as AttemptFnMapError;

export const attempt = Object.assign(tryDo, {
    promise: tryPromise,
    ok: <T>(data: T): Try<T, never> => ({
        ok: true,
        data
    }),
    fail: <T>(error: T): Try<never, T> => ({
        failed: true,
        error
    }),
    map: mapAttempt,
    mapError: mapAttemptError
});
