import { env } from '$env/dynamic/private';
import { Effect, Layer, ManagedRuntime, pipe } from 'effect';
import type { Context } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import jwt from 'jsonwebtoken';
import { ApiClient } from '~/lib/services/api_client.server';
import type { Environment } from '../server';
import { Fetcher } from '~/lib/services/fetcher.server';
import { BearerHttpApiClient } from '~/lib/services/bearer_api_client.server';
import { UniversalHttpClient } from '~/lib/services/universal_http_client';
import { HonoContext } from '../services/hono_context';

const { verify } = jwt;
const certBuffer = Buffer.from(env.JWT_PUBLIC_KEY.replaceAll('\\n', '\n'));

type AuthedEnvironment = Environment & {
    Variables: {
        user: { id: string };
    };
};

const FetcherLive = Layer.sync(Fetcher, () => fetch);

export const requireAuth = createMiddleware<AuthedEnvironment>((c, next) =>
    pipe(
        Effect.gen(function* () {
            const { accessToken } = yield* authenticateOrRefresh(c);
            const user = yield* decodeAccessToken(accessToken);
            c.set('user', { id: user.sub });
            c.set(
                'runtime',
                ManagedRuntime.make(
                    pipe(
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
                                    accessToken
                                });
                            })
                        ),
                        Layer.provide(FetcherLive),
                        Layer.merge(Layer.sync(HonoContext, () => c))
                    )
                )
            );
            return yield* Effect.promise(next);
        }),
        Effect.catchAll(() => Effect.succeed(c.newResponse(null, 403))),
        c.var.runtime.runPromise
    )
);

const authenticateOrRefresh = (c: Context) =>
    Effect.gen(function* () {
        const accessToken = getCookie(c, 'access_token');
        if (!accessToken) {
            const refreshToken = getCookie(c, 'refresh_token');
            if (!refreshToken) {
                return yield* Effect.fail<void>(void 0);
            }

            return yield* refresh(c, refreshToken);
        }
        return yield* Effect.succeed({ accessToken });
    });

const refresh = (c: Context, refreshToken: string) =>
    Effect.gen(function* () {
        const apiClient = yield* ApiClient;
        const response = yield* apiClient.post('tokens/refresh', { body: { refreshToken } });
        if (response.ok) {
            const result = yield* Effect.tryPromise(() =>
                response.json<{
                    accessToken: string;
                    accessTokenMaxAge: number;
                }>()
            );
            setCookie(c, 'access_token', result.accessToken, {
                path: '/',
                httpOnly: true,
                secure: true,
                maxAge: result.accessTokenMaxAge
            });
            return yield* Effect.succeed({ accessToken: result.accessToken });
        }
        return yield* Effect.fail<void>(void 0);
    });

const decodeAccessToken = (accessToken: string) =>
    Effect.async<{ sub: string }, void>((resume) => {
        verify(accessToken!, certBuffer, { algorithms: ['RS512'] }, (err, decoded) => {
            if (err || typeof decoded?.sub !== 'string') {
                resume(Effect.fail<void>(void 0));
            } else {
                resume(Effect.succeed(decoded as { sub: string }));
            }
        });
    });
