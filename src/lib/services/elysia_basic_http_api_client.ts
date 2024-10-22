import { Effect } from 'effect';
import { ApiError } from '../models/errors';
import { HttpApiClient } from './api_client.server';
import type { HttpClient, HttpClientFetchRequestInit } from './http_client';
import type { Cookie } from 'elysia';

export class ElysiaBasicHttpApiClient extends HttpApiClient {
    private readonly _cookie: Record<string, Cookie<string | undefined>>;

    public constructor(_options: {
        httpClient: HttpClient;
        cookie: Record<string, Cookie<string | undefined>>;
    }) {
        super(_options);
        this._cookie = _options.cookie;
    }

    public fetch(
        path: string,
        init?: HttpClientFetchRequestInit | undefined
    ): Effect.Effect<Response, ApiError, never> {
        return super
            .fetch(path, {
                ...init,
                headers: {
                    Authorization: `Basic ${this._cookie['plan_session']}`,
                    ...init?.headers
                }
            })
            .pipe(
                Effect.tap((a) => {
                    if (a.status === 401) {
                        this._cookie['plan_session'].set({
                            value: '',
                            httpOnly: true,
                            secure: true,
                            sameSite: 'lax',
                            path: '/'
                        });
                    }
                })
            );
    }
}
