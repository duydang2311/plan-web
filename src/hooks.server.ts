import { env } from '$env/dynamic/private';
import { error, redirect, type Handle } from '@sveltejs/kit';
import { Effect, Exit, Layer, ManagedRuntime, pipe } from 'effect';
import jwt from 'jsonwebtoken';
import { ApiClient, HttpApiClient } from './lib/services/api_client.server';
import { BearerHttpApiClient } from './lib/services/bearer_api_client.server';
import { Fetcher } from './lib/services/fetcher.server';
import { refresh } from './lib/utils/auth.server';
import { UniversalHttpClient } from './lib/services/universal_http_client';

if (!env.VERIFICATION_URL) throw new ReferenceError('VERIFICATION_URL must be provided');
if (!env.API_BASE_URL) throw new ReferenceError('API_BASE_URL must be provided');
if (!env.API_VERSION) throw new ReferenceError('API_VERSION must be provided');
if (!env.JWT_PUBLIC_KEY) throw new ReferenceError('JWT_PUBLIC_KEY must be provided');

const { verify } = jwt;
const HttpApiClientLive = Layer.effect(
    ApiClient,
    Effect.gen(function* () {
        const fetch = yield* Fetcher;
        return new HttpApiClient({
            httpClient: new UniversalHttpClient({
                baseUrl: env.API_BASE_URL,
                version: env.API_VERSION,
                fetch
            })
        });
    })
);
const certBuffer = Buffer.from(env.JWT_PUBLIC_KEY.replaceAll('\\n', '\n'));

export const handle: Handle = async ({
    event,
    event: { locals, route, cookies, fetch },
    resolve
}) => {
    if (route.id?.includes('(auth)')) {
        let accessToken = cookies.get('access_token');
        if (!accessToken) {
            locals.appLive = pipe(
                HttpApiClientLive,
                Layer.provide(Layer.sync(Fetcher, () => fetch))
            );
            locals.runtime = ManagedRuntime.make(locals.appLive);
            const exit = await locals.runtime.runPromiseExit(refresh(cookies));
            if (Exit.isSuccess(exit)) {
                accessToken = exit.value.accessToken;
            }
        }
        if (accessToken) {
            locals.appLive = pipe(
                Layer.effect(
                    ApiClient,
                    Effect.gen(function* () {
                        const fetch = yield* Fetcher;
                        return new BearerHttpApiClient({
                            httpClient: new UniversalHttpClient({
                                baseUrl: env.API_BASE_URL,
                                version: env.API_VERSION,
                                fetch
                            }),
                            accessToken: accessToken!
                        });
                    })
                ),
                Layer.provide(Layer.sync(Fetcher, () => fetch))
            );
            locals.runtime = ManagedRuntime.make(locals.appLive);
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
            return route.id.includes('api')
                ? error(403, { code: 'forbidden', message: 'Forbidden' })
                : redirect(302, '/login');
        }
    } else {
        locals.appLive = pipe(HttpApiClientLive, Layer.provide(Layer.sync(Fetcher, () => fetch)));
        locals.runtime = ManagedRuntime.make(locals.appLive);
    }
    const response = await resolve(event);
    await locals.runtime.dispose();
    return response;
};
