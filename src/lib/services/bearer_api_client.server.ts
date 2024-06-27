import type { Effect } from 'effect/Effect';
import type { ApiError } from '../models/errors';
import {
	HttpApiClient,
	type ApiClientFetchRequestInit,
	type ApiClientOptions
} from './api_client.server';

export interface BearerHttpApiClientOptions extends ApiClientOptions {
	accessToken: string;
}

export class BearerHttpApiClient extends HttpApiClient {
	private readonly _accessToken: string;

	public constructor(_options: BearerHttpApiClientOptions) {
		super(_options);
		this._accessToken = _options.accessToken;
	}

	public fetch(
		path: string,
		init?: ApiClientFetchRequestInit | undefined
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
