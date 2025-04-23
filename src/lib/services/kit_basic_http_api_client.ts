import { Context, Effect } from 'effect';
import { ApiError } from '../models/errors';
import { HttpApiClient } from './api_client.server';
import type { HttpClient, HttpClientFetchRequestInit } from './http_client';
import type { Cookies } from '@sveltejs/kit';

export class KitBasicHttpApiClient extends HttpApiClient {
    private readonly _cookies: Cookies;

    public constructor(_options: {
        httpClient: Context.Tag.Service<HttpClient>;
        cookies: Cookies;
    }) {
        super(_options);
        this._cookies = _options.cookies;
    }

    public fetch(
        path: string,
        init?: HttpClientFetchRequestInit | undefined
    ): Effect.Effect<Response, ApiError, never> {
        return super
            .fetch(path, {
                ...init,
                headers: {
                    Authorization: `Session ${this._cookies.get('plan_session')}`,
                    ...init?.headers
                }
            })
            .pipe(
                Effect.tap((a) => {
                    if (a.status === 401) {
                        this._cookies.delete('plan_session', {
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
