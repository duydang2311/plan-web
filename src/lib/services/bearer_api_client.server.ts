import type { Effect } from 'effect/Effect';
import type { ApiError } from '../models/errors';
import { HttpApiClient } from './api_client.server';
import type { HttpClient, HttpClientFetchRequestInit } from './http_client';

export class BearerHttpApiClient extends HttpApiClient {
    private readonly _accessToken: string;

    public constructor(_options: { httpClient: HttpClient; accessToken: string }) {
        super(_options);
        this._accessToken = _options.accessToken;
    }

    public fetch(
        path: string,
        init?: HttpClientFetchRequestInit | undefined
    ): Effect<Response, ApiError, never> {
        return super.fetch(path, {
            ...init,
            headers: {
                Authorization: `Bearer ${this._accessToken}`,
                ...init?.headers
            }
        });
    }
}
