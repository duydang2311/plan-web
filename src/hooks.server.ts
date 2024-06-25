import type { Handle } from '@sveltejs/kit';
import { Layer } from 'effect';
import { ApiClientTag, HttpApiClient } from './lib/services/api_client.server';
import { env } from '$env/dynamic/private';
import jwt from 'jsonwebtoken';

if (!env.VERIFICATION_URL) throw new ReferenceError('VERIFICATION_URL must be provided');
if (!env.API_BASE_URL) throw new ReferenceError('API_BASE_URL must be provided');
if (!env.API_VERSION) throw new ReferenceError('API_VERSION must be provided');
if (!env.JWT_PUBLIC_KEY) throw new ReferenceError('JWT_PUBLIC_KEY must be provided');

const apiClient = new HttpApiClient({
	baseUrl: env.API_BASE_URL,
	version: env.API_VERSION
});

const { verify } = jwt;
const ApiLive = Layer.succeed(ApiClientTag, apiClient);
const AppLive = ApiLive;
const certBuffer = Buffer.from(env.JWT_PUBLIC_KEY.replace('\\n', '\n'));

export const handle: Handle = async ({ event, resolve }) => {
	if (event.route.id?.includes('(auth)')) {
		const accessToken = event.cookies.get('access_token');
		if (accessToken) {
			await new Promise<void>((resolve) => {
				verify(accessToken, certBuffer, { algorithms: ['RS512'] }, (err, decoded) => {
					if (err || typeof decoded?.sub !== 'string') {
						event.cookies.delete('access_token', { path: '/' });
					} else {
						event.locals.user = { id: decoded.sub };
					}
					resolve();
				});
			});
		}
	}
	event.locals.appLive = AppLive;
	return resolve(event);
};
