import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
import { Effect, Exit, Layer } from 'effect';
import type { Asset } from './lib/models/asset';
import { ApiClient, HttpApiClient } from './lib/services/api_client.server';
import { Cloudinary } from './lib/services/cloudinary.server';
import { KitBasicHttpApiClient } from './lib/services/kit_basic_http_api_client';
import { UniversalHttpClient } from './lib/services/universal_http_client';
import { attempt } from './lib/utils/try';
import { PermissionService } from './lib/services/permission_service.server';
import { SessionHttpClient } from './lib/services/session_http_client.server';

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
                request.headers.set('Authorization', `Session ${session}`);
            }
        }
        return globalThis.fetch(`${env.API_ORIGIN}${url.pathname}${url.search}`, request);
    }

    const httpClient = new UniversalHttpClient({
        baseUrl: env.API_BASE_URL,
        version: env.API_VERSION,
        fetch
    });

    const isAuthRoute = routeId.includes('(auth)');
    const isAuthOptionalRoute = routeId.includes('(auth-optional)');
    if (isAuthRoute || isAuthOptionalRoute) {
        const sessionId = cookies.get('plan_session');
        if (!sessionId) {
            return redirect(302, '/login');
        }

        const getSessionAttempt = await attempt.promise(() =>
            httpClient.get(`sessions/${sessionId}`, {
                query: {
                    select: 'User.Id,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image'
                }
            })
        )();

        if (!getSessionAttempt.ok || !getSessionAttempt.data.ok) {
            if (isAuthRoute) {
                return redirect(302, '/login');
            }

            initLocals(locals, httpClient);
            return resolve(event);
        }

        const jsonAttempt = await attempt.promise(() =>
            getSessionAttempt.data.json<{
                user: {
                    id: string;
                    email: string;
                    profile?: { name: string; displayName: string; image?: Asset };
                };
            }>()
        )();

        if (!jsonAttempt.ok) {
            if (isAuthRoute) {
                return redirect(302, '/login');
            }

            initLocals(locals, httpClient);
            return resolve(event);
        }

        const ApiClientLive = Layer.sync(
            ApiClient,
            () =>
                new KitBasicHttpApiClient({
                    httpClient,
                    cookies
                })
        );
        locals.user = { ...jsonAttempt.data.user };
        locals.appLive = Layer.mergeAll(
            ApiClientLive,
            Cloudinary.Live,
            PermissionService.Live.pipe(Layer.provide(ApiClientLive))
        );
        locals.runtime = {
            runPromise: makeRunPromise(locals.appLive),
            runPromiseExit: makeRunPromiseExit(locals.appLive)
        };
        locals.api = new SessionHttpClient({
            baseUrl: env.API_BASE_URL,
            version: env.API_VERSION,
            fetch,
            cookies
        });

        return resolve(event);
    }

    initLocals(locals, httpClient);
    return resolve(event);
};

const initLocals = (locals: App.Locals, httpClient: UniversalHttpClient) => {
    var ApiClientLive = Layer.sync(
        ApiClient,
        () =>
            new HttpApiClient({
                httpClient
            })
    );
    locals.api = httpClient;
    locals.appLive = Layer.mergeAll(
        ApiClientLive,
        Cloudinary.Live,
        PermissionService.Live.pipe(Layer.provide(ApiClientLive))
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
