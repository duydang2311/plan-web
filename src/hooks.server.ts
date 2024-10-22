import { env } from '$env/dynamic/private';
import { redirect, type Handle } from '@sveltejs/kit';
import { Layer, ManagedRuntime, pipe } from 'effect';
import { ApiClient, HttpApiClient } from './lib/services/api_client.server';
import { KitBasicHttpApiClient } from './lib/services/kit_basic_http_api_client';
import { UniversalHttpClient } from './lib/services/universal_http_client';

if (!env.VERIFICATION_URL) throw new ReferenceError('VERIFICATION_URL must be provided');
if (!env.API_BASE_URL) throw new ReferenceError('API_BASE_URL must be provided');
if (!env.API_VERSION) throw new ReferenceError('API_VERSION must be provided');
if (!env.JWT_PUBLIC_KEY) throw new ReferenceError('JWT_PUBLIC_KEY must be provided');

export const handle: Handle = async ({
    event,
    event: { locals, route, cookies, fetch },
    resolve
}) => {
    const routeId = route.id;
    if (
        !routeId ||
        (routeId.charCodeAt(1) === 97 && // a
            routeId.charCodeAt(2) === 112 && // p
            routeId.charCodeAt(3) === 105) // i
    ) {
        return await resolve(event);
    }

    const isAuthRoute = routeId.includes('(auth)');
    const isAuthOptionalRoute = routeId.includes('(auth-optional)');
    if (isAuthRoute || isAuthOptionalRoute) {
        const sessionId = cookies.get('plan_session');
        if (!sessionId) {
            return redirect(302, '/login');
        }

        locals.user = { id: '' };
        locals.appLive = pipe(
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
            )
        );
        locals.runtime = ManagedRuntime.make(locals.appLive);
    } else {
        initLocals(locals, fetch);
    }

    const response = await resolve(event);
    await locals.runtime?.dispose();
    return response;
};

function initLocals(locals: App.Locals, fetch: typeof globalThis.fetch) {
    locals.appLive = Layer.mergeAll(
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
        )
    );
    locals.runtime = ManagedRuntime.make(locals.appLive);
}
