import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
import { Effect, Exit, Layer, type Context } from 'effect';
import type { Asset } from './lib/models/asset';
import { errorCodes } from './lib/models/errors';
import { ApiClient, HttpApiClient } from './lib/services/api_client.server';
import { Cloudinary } from './lib/services/cloudinary.server';
import type { HttpClient } from './lib/services/http_client';
import { KitBasicHttpApiClient } from './lib/services/kit_basic_http_api_client';
import { PermissionService } from './lib/services/permission_service.server';
import { SessionHttpClient } from './lib/services/session_http_client.server';
import { UniversalHttpClient } from './lib/services/universal_http_client';
import { attempt } from './lib/utils/try';

if (!env.VERIFICATION_URL) throw new ReferenceError('VERIFICATION_URL must be provided');
if (!env.API_BASE_URL) throw new ReferenceError('API_BASE_URL must be provided');
if (!env.API_VERSION) throw new ReferenceError('API_VERSION must be provided');

export const handle: Handle = async ({
    event,
    event: { request, route, url, locals, cookies, fetch },
    resolve
}) => {
    const routeId = route.id;
    if (!routeId) {
        return resolve(event);
    }

    const pathname = url.pathname;
    const isApiRoute = pathname.substring(1, 4) === 'api';
    if (isApiRoute) {
        const isInternalApi = pathname.substring(5, 14) === 'internals';
        if (!isInternalApi) {
            if (!request.headers.has('Authorization')) {
                const session = cookies.get('plan_session');
                if (session) {
                    request.headers.set('Authorization', `Session ${session}`);
                }
            }
            return globalThis.fetch(`${env.API_ORIGIN}${url.pathname}${url.search}`, request);
        }
    }

    const httpClient = new UniversalHttpClient({
        baseUrl: env.API_BASE_URL,
        version: env.API_VERSION,
        fetch
    });

    if (routeId.includes('(auth)')) {
        const authAttempt = await authenticate(httpClient)(cookies.get('plan_session'));
        if (authAttempt.failed) {
            return isApiRoute ? new Response(null, { status: 401 }) : redirect(302, '/login');
        }
        locals.user = authAttempt.data.user;
    } else if (routeId.includes('(auth-optional)')) {
        const authAttempt = await authenticate(httpClient)(cookies.get('plan_session'));
        if (authAttempt.failed) {
            initLocals(locals, httpClient);
            return resolve(event);
        }
        locals.user = authAttempt.data.user;
    } else {
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
};

const initLocals = (locals: App.Locals, httpClient: UniversalHttpClient) => {
    const ApiClientLive = Layer.sync(
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

const authenticate =
    (httpClient: Context.Tag.Service<HttpClient>) => async (sessionId: string | undefined) => {
        if (!sessionId) {
            return attempt.fail('no_session' as const);
        }

        const getSessionAttempt = await attempt.promise(() =>
            httpClient.get(`sessions/${sessionId}`, {
                query: {
                    select: 'User.Id,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image'
                }
            })
        )(errorCodes.fromFetch);
        if (getSessionAttempt.failed || !getSessionAttempt.data.ok) {
            return attempt.fail(
                getSessionAttempt.failed
                    ? getSessionAttempt.error
                    : getSessionAttempt.data.status.toString()
            );
        }

        return await attempt.promise(() =>
            getSessionAttempt.data.json<{
                user: {
                    id: string;
                    email: string;
                    profile?: { name: string; displayName: string; image?: Asset };
                };
            }>()
        )(errorCodes.fromJson);
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
