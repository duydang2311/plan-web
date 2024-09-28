import { env } from '$env/dynamic/private';
import { Layer, ManagedRuntime } from 'effect';
import { Elysia } from 'elysia';
import { ApiClient, HttpApiClient } from '../services/api_client.server';
import { UniversalHttpClient } from '../services/universal_http_client';
import { ErrorFnLive } from './contexts';
import { users } from './routes/users';

const baseApp = new Elysia({ prefix: '/api' }).decorate(
    'runtime',
    ManagedRuntime.make(
        Layer.mergeAll(
            Layer.sync(
                ApiClient,
                () =>
                    new HttpApiClient({
                        httpClient: new UniversalHttpClient({
                            baseUrl: env.API_BASE_URL,
                            version: env.API_VERSION,
                            fetch: globalThis.fetch
                        })
                    })
            ),
            ErrorFnLive
        )
    )
);

export type BaseApp = typeof baseApp;

export const app = baseApp.use(users);
