import type { Handle } from '@sveltejs/kit';
import { Layer } from 'effect';
import { ApiClientTag, HttpApiClient } from './lib/services/api_client.server';

const apiClient = new HttpApiClient({
	baseUrl: 'http://127.0.0.1:5051/api',
	version: 'v1'
});

const ApiLive = Layer.succeed(ApiClientTag, apiClient);
const AppLive = Layer.merge(ApiLive, Layer.empty);

export const handle: Handle = ({ event, resolve }) => {
	event.locals.appLive = AppLive;
	return resolve(event);
};
