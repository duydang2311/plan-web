export type Try<TData, TError> = Attempt<TData, TError>;
export type Attempt<TData, TError> =
    | {
          ok: true;
          data: TData;
      }
    | {
          ok: false;
          error: TError;
      };

export const tryDo = <TData>(fn: () => TData) => {
    return <TError>(mapException?: (e: unknown) => TError): Attempt<TData, TError> => {
        try {
            return {
                ok: true,
                data: fn()
            };
        } catch (e) {
            return {
                ok: false,
                error: mapException ? mapException(e) : (e as TError)
            };
        }
    };
};

export const tryPromise = <TData>(fn: () => Promise<TData>) => {
    return async <TError>(
        mapException?: (e: unknown) => TError
    ): Promise<Attempt<TData, TError>> => {
        try {
            return {
                ok: true,
                data: await fn()
            };
        } catch (e) {
            return {
                ok: false,
                error: mapException ? mapException(e) : (e as TError)
            };
        }
    };
};

export const attempt = Object.assign(tryDo, {
    promise: tryPromise,
    ok: <T>(data: T): Try<T, never> => ({
        ok: true,
        data
    }),
    fail: <T>(error: T): Try<never, T> => ({
        ok: false,
        error
    })
});
