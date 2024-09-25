import { env } from '$env/dynamic/private';
import { Effect, Layer, ManagedRuntime, pipe } from 'effect';
import { createMiddleware } from 'hono/factory';
import { ApiClient, HttpApiClient } from '~/lib/services/api_client.server';
import { Fetcher } from '~/lib/services/fetcher.server';
import { UniversalHttpClient } from '~/lib/services/universal_http_client';
import { HonoContext } from '../services/hono_context';

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

export const install_base = createMiddleware((c, next) =>
    Effect.gen(function* () {
        c.set(
            'runtime',
            ManagedRuntime.make(
                pipe(
                    pipe(HttpApiClientLive, Layer.provide(Layer.sync(Fetcher, () => fetch))),
                    Layer.merge(Layer.sync(HonoContext, () => c))
                )
            )
        );
        yield* Effect.promise(next);
    }).pipe(Effect.runPromise)
);
