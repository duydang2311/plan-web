import type { Handle } from '@sveltejs/kit';
import { Layer } from 'effect';
import { ApiClientTag, HttpApiClient } from './lib/services/api_client.server';
import { env } from '$env/dynamic/private';

if (!env.VERIFICATION_URL) {
	throw new ReferenceError('VERIFICATION_URL must be provided');
}

const apiClient = new HttpApiClient({
	baseUrl: 'http://127.0.0.1:5051/api',
	version: 'v1'
});

const ApiLive = Layer.succeed(ApiClientTag, apiClient);
const AppLive = ApiLive;

export const handle: Handle = ({ event, resolve }) => {
	event.locals.appLive = AppLive;
	return resolve(event);
};
