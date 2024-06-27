import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
import { Exit, Layer, ManagedRuntime } from 'effect';
import jwt from 'jsonwebtoken';
import { ApiClientTag, HttpApiClient } from './lib/services/api_client.server';
import { refresh } from './lib/utils/auth.server';
import { BearerHttpApiClient } from './lib/services/bearer_api_client.server';

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
const certBuffer = Buffer.from(env.JWT_PUBLIC_KEY.replaceAll('\\n', '\n'));
const runtime = ManagedRuntime.make(AppLive);

export const handle: Handle = async ({ event, event: { locals, route, cookies }, resolve }) => {
	let shouldDispose = false;
	locals.appLive = AppLive;
	locals.runtime = runtime;
	if (route.id?.includes('(auth)')) {
		let accessToken = cookies.get('access_token');
		if (!accessToken) {
			const exit = await runtime.runPromiseExit(refresh(cookies));
			if (Exit.isSuccess(exit)) {
				accessToken = exit.value.accessToken;
			}
		}
		if (accessToken) {
			locals.appLive = Layer.sync(
				ApiClientTag,
				() =>
					new BearerHttpApiClient({
						baseUrl: env.API_BASE_URL,
						version: env.API_VERSION,
						accessToken: accessToken!
					})
			);
			locals.runtime = ManagedRuntime.make(locals.appLive);
			shouldDispose = true;
			await new Promise<void>((resolve) => {
				verify(accessToken!, certBuffer, { algorithms: ['RS512'] }, (err, decoded) => {
					if (err || typeof decoded?.sub !== 'string') {
						cookies.delete('access_token', { path: '/' });
					} else {
						locals.user = { id: decoded.sub };
					}
					resolve();
				});
			});
		} else {
			return redirect(302, '/login');
		}
	}
	const response = await resolve(event);
	if (shouldDispose) {
		await locals.runtime.dispose();
	}
	return response;
};

if (import.meta.env.MODE === 'production') {
	async function shutdownGracefully() {
		await runtime.dispose();
	}

	process.on('sveltekit:shutdown', shutdownGracefully);
}
