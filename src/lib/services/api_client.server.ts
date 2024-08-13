import { Context, Effect } from 'effect';
import { ApiError } from '~/lib/models/errors';
import type { HttpClientFetchRequestInit, HttpClient } from './http_client';

export class ApiClient extends Context.Tag('ApiClient')<
    ApiClient,
    {
        fetch(path: string, init?: HttpClientFetchRequestInit): Effect.Effect<Response, ApiError>;
        get(path: string, init?: HttpClientFetchRequestInit): Effect.Effect<Response, ApiError>;
        post(path: string, init?: HttpClientFetchRequestInit): Effect.Effect<Response, ApiError>;
        head(path: string, init?: HttpClientFetchRequestInit): Effect.Effect<Response, ApiError>;
        patch(path: string, init?: HttpClientFetchRequestInit): Effect.Effect<Response, ApiError>;
        delete(path: string, init?: HttpClientFetchRequestInit): Effect.Effect<Response, ApiError>;
        put(path: string, init?: HttpClientFetchRequestInit): Effect.Effect<Response, ApiError>;
    }
>() {}

export class HttpApiClient implements Context.Tag.Service<ApiClient> {
    public constructor(private readonly _options: { httpClient: HttpClient }) {}

    public fetch(
        path: string,
        init?: HttpClientFetchRequestInit
    ): Effect.Effect<Response, ApiError> {
        return Effect.gen(this, function* () {
            return yield* Effect.tryPromise({
                try: (signal) =>
                    this._options.httpClient.fetch(path, {
                        ...init,
                        signal: init?.signal ?? signal
                    }),
                catch: catchError
            });
        });
    }

    get(
        path: string,
        init?: HttpClientFetchRequestInit | undefined
    ): Effect.Effect<Response, ApiError> {
        return this.fetch(path, { method: 'get', ...init });
    }

    post(
        path: string,
        init?: HttpClientFetchRequestInit | undefined
    ): Effect.Effect<Response, ApiError> {
        return this.fetch(path, { method: 'post', ...init });
    }

    head(
        path: string,
        init?: HttpClientFetchRequestInit | undefined
    ): Effect.Effect<Response, ApiError> {
        return this.fetch(path, { method: 'head', ...init });
    }

    patch(
        path: string,
        init?: HttpClientFetchRequestInit | undefined
    ): Effect.Effect<Response, ApiError> {
        return this.fetch(path, { method: 'PATCH', ...init });
    }

    delete(
        path: string,
        init?: HttpClientFetchRequestInit | undefined
    ): Effect.Effect<Response, ApiError> {
        return this.fetch(path, { method: 'delete', ...init });
    }

    put(
        path: string,
        init?: HttpClientFetchRequestInit | undefined
    ): Effect.Effect<Response, ApiError> {
        return this.fetch(path, { method: 'put', ...init });
    }
}

function catchError(e: unknown) {
    if (e instanceof ApiError) {
        return e;
    }
    if (e instanceof Error) {
        return new ApiError({ code: 'fetch', message: e.message, cause: e.cause, stack: e.stack });
    }
    return new ApiError({ code: 'fetch', message: e?.toString(), cause: e });
}
