export type Try<TData, TError> = Attempt<TData, TError>;
export type Attempt<TData, TError> =
    | {
          ok: true;
          failed: false;
          data: TData;
      }
    | {
          ok: false;
          failed: true;
          error: TError;
      };

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

export const attempt = Object.assign(tryDo, {
    promise: tryPromise,
    ok: <T>(data: T): Try<T, never> => ({
        ok: true,
        failed: false,
        data
    }),
    fail: <T>(error: T): Try<never, T> => ({
        ok: false,
        failed: true,
        error
    })
});
