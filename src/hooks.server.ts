import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
import { Effect, Exit, Layer } from 'effect';
import { ApiClient, HttpApiClient } from './lib/services/api_client.server';
import { Cloudinary } from './lib/services/cloudinary.server';
import { HttpClient } from './lib/services/http_client';
import { KitBasicHttpApiClient } from './lib/services/kit_basic_http_api_client';
import { UniversalHttpClient } from './lib/services/universal_http_client';

if (!env.VERIFICATION_URL) throw new ReferenceError('VERIFICATION_URL must be provided');
if (!env.API_BASE_URL) throw new ReferenceError('API_BASE_URL must be provided');
if (!env.API_VERSION) throw new ReferenceError('API_VERSION must be provided');

export const handle: Handle = async ({
    event,
    event: { request, url, locals, route, cookies, fetch },
    resolve
}) => {
    const routeId = route.id;
    if (
        !routeId ||
        (routeId.charCodeAt(1) === 97 && // a
            routeId.charCodeAt(2) === 112 && // p
            routeId.charCodeAt(3) === 105) // i
    ) {
        if (!request.headers.has('Authorization')) {
            const session = cookies.get('plan_session');
            if (session) {
                request.headers.set('Authorization', `Basic ${cookies.get('plan_session')}`);
            }
        }
        return globalThis.fetch(`${env.API_ORIGIN}${url.pathname}${url.search}`, request);
    }

    initLocals(locals, fetch);

    const isAuthRoute = routeId.includes('(auth)');
    const isAuthOptionalRoute = routeId.includes('(auth-optional)');
    if (isAuthRoute || isAuthOptionalRoute) {
        const sessionId = cookies.get('plan_session');
        if (!sessionId) {
            return redirect(302, '/login');
        }

        const exit = await ApiClient.pipe(
            Effect.flatMap((a) => a.get(`sessions/${sessionId}`)),
            Effect.filterOrFail((a) => a.ok),
            Effect.flatMap((a) => Effect.tryPromise(() => a.json<{ userId: string }>())),
            locals.runtime.runPromiseExit
        );

        if (Exit.isFailure(exit)) {
            return redirect(302, '/login');
        }

        locals.user = { id: exit.value.userId };
        locals.appLive = Layer.mergeAll(
            HttpClient.Live(fetch),
            Layer.sync(
                ApiClient,
                () =>
                    new KitBasicHttpApiClient({
                        httpClient: new UniversalHttpClient({
                            baseUrl: env.API_BASE_URL,
                            version: env.API_VERSION,
                            fetch
                        }),
                        cookies
                    })
            ),
            Cloudinary.Live
        );
        locals.runtime = {
            runPromise: makeRunPromise(locals.appLive),
            runPromiseExit: makeRunPromiseExit(locals.appLive)
        };
    }

    const response = await resolve(event);
    return response;
};

const initLocals = (locals: App.Locals, fetch: typeof globalThis.fetch) => {
    locals.appLive = Layer.mergeAll(
        HttpClient.Live(fetch),
        Layer.sync(
            ApiClient,
            () =>
                new HttpApiClient({
                    httpClient: new UniversalHttpClient({
                        baseUrl: env.API_BASE_URL,
                        version: env.API_VERSION,
                        fetch
                    })
                })
        ),
        Cloudinary.Live
    );
    locals.runtime = {
        runPromise: makeRunPromise(locals.appLive),
        runPromiseExit: makeRunPromiseExit(locals.appLive)
    };
};

const makeRunPromise =
    <R>(appLive: Layer.Layer<R>) =>
    <A, E, R>(
        effect: Effect.Effect<A, E, R>,
        options?: { readonly signal?: AbortSignal } | undefined
    ): Promise<A> =>
        effect.pipe(Effect.provide(appLive), (e) =>
            Effect.runPromise(e as Effect.Effect<A, E, never>, options)
        );

const makeRunPromiseExit =
    <R>(appLive: Layer.Layer<R>) =>
    <A, E, R>(
        effect: Effect.Effect<A, E, R>,
        options?: { readonly signal?: AbortSignal } | undefined
    ): Promise<Exit.Exit<A, E>> =>
        effect.pipe(Effect.provide(appLive), (e) =>
            Effect.runPromiseExit(e as Effect.Effect<A, E, never>, options)
        );
