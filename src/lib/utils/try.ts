export type Try<TData, TError> =
    | {
          ok: true;
          data: TData;
      }
    | {
          ok: false;
          error: TError;
      };

export const tryDo = <TData>(fn: () => TData) => {
    return <TError>(mapException?: (e: unknown) => TError): Try<TData, TError> => {
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
    return async <TError>(mapException?: (e: unknown) => TError): Promise<Try<TData, TError>> => {
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
