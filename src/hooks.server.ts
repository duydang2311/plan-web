import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
import { Effect, Exit, Layer, ManagedRuntime, pipe } from 'effect';
import { app } from './lib/elysia_api/server';
import { ApiClient, HttpApiClient } from './lib/services/api_client.server';
import { BearerHttpApiClient } from './lib/services/bearer_api_client.server';
import { Fetcher } from './lib/services/fetcher.server';
import { UniversalHttpClient } from './lib/services/universal_http_client';
import { decodeAccessToken, refresh } from './lib/utils/auth.server';

if (!env.VERIFICATION_URL) throw new ReferenceError('VERIFICATION_URL must be provided');
if (!env.API_BASE_URL) throw new ReferenceError('API_BASE_URL must be provided');
if (!env.API_VERSION) throw new ReferenceError('API_VERSION must be provided');
if (!env.JWT_PUBLIC_KEY) throw new ReferenceError('JWT_PUBLIC_KEY must be provided');

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

export const handle: Handle = async ({
    event,
    event: { locals, route, cookies, fetch },
    resolve
}) => {
    if (!route.id) {
        return await resolve(event);
    }

    const routeId = route.id;
    if (routeId.startsWith('/api')) {
        return await app.handle(event.request);
    }

    const isAuthRoute = routeId.includes('(auth)');
    const isAuthOptionalRoute = routeId.includes('(auth-optional)');
    if (isAuthRoute || isAuthOptionalRoute) {
        let accessToken = cookies.get('access_token');
        let failed = true;
        if (!accessToken) {
            initLocals(locals, fetch);
            const exit = await locals.runtime.runPromiseExit(refresh(cookies));
            if (Exit.isSuccess(exit)) {
                accessToken = exit.value.accessToken;
            }
        }
        if (accessToken) {
            const exit = await Effect.runPromiseExit(decodeAccessToken(accessToken));
            if (Exit.isFailure(exit)) {
                cookies.delete('access_token', { path: '/' });
            } else {
                locals.user = { id: exit.value.sub };
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
                failed = false;
            }
        }
        if (failed && isAuthRoute) {
            return redirect(302, '/login');
        }
    } else {
        initLocals(locals, fetch);
    }

    const response = await resolve(event);
    await locals.runtime?.dispose();
    return response;
};

function initLocals(locals: App.Locals, fetch: typeof globalThis.fetch) {
    locals.appLive = pipe(HttpApiClientLive, Layer.provide(Layer.sync(Fetcher, () => fetch)));
    locals.runtime = ManagedRuntime.make(locals.appLive);
}
