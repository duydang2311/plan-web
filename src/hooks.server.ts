import type { Handle } from '@sveltejs/kit';
import { Layer } from 'effect';
import { ApiClientTag, HttpApiClient } from './lib/services/api_client.server';
import { env } from '$env/dynamic/private';

if (!env.VERIFICATION_URL) {
	throw new ReferenceError('VERIFICATION_URL must be provided');
}

if (!env.API_BASE_URL) {
	throw new ReferenceError('API_BASE_URL must be provided');
}

if (!env.API_VERSION) {
	throw new ReferenceError('API_VERSION must be provided');
}

const apiClient = new HttpApiClient({
	baseUrl: env.API_BASE_URL,
	version: env.API_VERSION
});

const ApiLive = Layer.succeed(ApiClientTag, apiClient);
const AppLive = ApiLive;

export const handle: Handle = ({ event, resolve }) => {
	event.locals.appLive = AppLive;
	return resolve(event);
};
