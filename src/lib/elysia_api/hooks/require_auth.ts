import { env } from '$env/dynamic/private';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { ElysiaBasicHttpApiClient } from '~/lib/services/elysia_basic_http_api_client';
import { UniversalHttpClient } from '~/lib/services/universal_http_client';
import { CloudinaryLive, ErrorFnLive } from '../contexts';
import { baseApp, ElysiaResponse } from '../utils/elysia';

export const requireAuth = baseApp().derive({ as: 'scoped' }, ({ cookie, runtime }) => {
    return Effect.gen(function* () {
        const sessionId = cookie['plan_session'].value;
        if (!sessionId) {
            return yield* ElysiaResponse.UnauthorizedError();
        }

        const response = yield* (yield* ApiClient)
            .get(`sessions/${sessionId}`, {
                query: { select: 'UserId' }
            })
            .pipe(Effect.catchAll(ElysiaResponse.FetchError));

        if (response.status === 401) {
            return yield* ElysiaResponse.UnauthorizedError();
        }

        if (!response.ok) {
            return yield* ElysiaResponse.HTTPError(response);
        }

        const json = yield* ElysiaResponse.JSON(() => response.json<{ userId: string }>());

        return {
            user: { id: json.userId },
            runtime: ManagedRuntime.make(
                Layer.mergeAll(
                    Layer.sync(
                        ApiClient,
                        () =>
                            new ElysiaBasicHttpApiClient({
                                httpClient: new UniversalHttpClient({
                                    baseUrl: env.API_BASE_URL,
                                    version: env.API_VERSION,
                                    fetch
                                }),
                                cookie
                            })
                    ),
                    ErrorFnLive,
                    CloudinaryLive
                )
            )
        };
    }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
});
