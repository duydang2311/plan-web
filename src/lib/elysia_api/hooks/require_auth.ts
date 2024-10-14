import { env } from '$env/dynamic/private';
import { Effect, Layer, ManagedRuntime } from 'effect';
import { type Cookie } from 'elysia';
import jwt from 'jsonwebtoken';
import { Buffer } from 'node:buffer';
import { UnauthorizedError } from '~/lib/models/errors';
import { ApiClient } from '~/lib/services/api_client.server';
import { BearerHttpApiClient } from '~/lib/services/bearer_api_client.server';
import { UniversalHttpClient } from '~/lib/services/universal_http_client';
import { ErrorFnLive } from '../contexts';
import { baseApp, ElysiaResponse } from '../utils/elysia';

const { verify } = jwt;
const certBuffer = Buffer.from(env.JWT_PUBLIC_KEY.replaceAll('\\n', '\n'));

export const requireAuth = baseApp().derive({ as: 'scoped' }, ({ cookie, runtime }) => {
    return Effect.gen(function* () {
        const { accessToken } = yield* authenticateOrRefresh(cookie);
        const user = yield* decodeAccessToken(accessToken);
        return {
            user,
            runtime: ManagedRuntime.make(
                Layer.mergeAll(
                    Layer.sync(
                        ApiClient,
                        () =>
                            new BearerHttpApiClient({
                                httpClient: new UniversalHttpClient({
                                    baseUrl: env.API_BASE_URL,
                                    version: env.API_VERSION,
                                    fetch
                                }),
                                accessToken
                            })
                    ),
                    ErrorFnLive
                )
            )
        };
    }).pipe(
        Effect.catchTags({
            UnauthorizedError: ElysiaResponse.UnauthorizedError
        }),
        Effect.catchAll(Effect.succeed),
        runtime.runPromise
    );
});

const authenticateOrRefresh = (
    cookie: Record<'access_token' | 'refresh_token', Cookie<string | undefined>>
) =>
    Effect.gen(function* () {
        const accessToken = cookie.access_token.value;
        if (accessToken) {
            return { accessToken };
        }

        const refreshToken = cookie.refresh_token.value;
        if (!refreshToken) {
            return yield* Effect.fail(UnauthorizedError.instance);
        }
        return yield* refresh(cookie, refreshToken);
    });

const refresh = (
    cookie: Record<'access_token' | 'refresh_token', Cookie<string | undefined>>,
    refreshToken: string
) =>
    Effect.gen(function* () {
        const apiClient = yield* ApiClient;
        const response = yield* ElysiaResponse.HTTP(
            apiClient.post('tokens/refresh', { body: { refreshToken } })
        );
        const result = yield* ElysiaResponse.JSON(() =>
            response.json<{
                accessToken: string;
                accessTokenMaxAge: number;
            }>()
        );
        cookie.access_token.set({
            value: result.accessToken,
            path: '/',
            httpOnly: true,
            sameSite: 'lax',
            secure: true,
            maxAge: result.accessTokenMaxAge
        });
        return { accessToken: result.accessToken };
    });

const decodeAccessToken = (accessToken: string) =>
    Effect.async<{ sub: string }, UnauthorizedError>((resume) => {
        verify(accessToken!, certBuffer, { algorithms: ['RS512'] }, (err, decoded) => {
            if (err || typeof decoded?.sub !== 'string') {
                resume(Effect.fail(UnauthorizedError.instance));
            } else {
                resume(Effect.succeed(decoded as { sub: string }));
            }
        });
    });
