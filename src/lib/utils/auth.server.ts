import { env } from '$env/dynamic/private';
import type { Cookies } from '@sveltejs/kit';
import { Effect } from 'effect';
import jwt from 'jsonwebtoken';
import { ApiClient } from '../services/api_client.server';

const { verify } = jwt;
const certBuffer = Buffer.from(env.JWT_PUBLIC_KEY.replaceAll('\\n', '\n'));

export const authenticateOrRefresh = (cookies: Cookies) =>
    Effect.gen(function* () {
        const accessToken = cookies.get('access_token');
        if (!accessToken) {
            const refreshToken = cookies.get('refresh_token');
            if (!refreshToken) {
                return yield* Effect.fail<void>(void 0);
            }

            return yield* refresh(cookies);
        }
        return yield* Effect.succeed({ accessToken });
    });

export const refresh = (cookies: Cookies) =>
    Effect.gen(function* () {
        const refreshToken = cookies.get('refresh_token');
        if (!refreshToken) {
            return yield* Effect.fail<void>(void 0);
        }

        const apiClient = yield* ApiClient;
        const response = yield* apiClient.post('tokens/refresh', { body: { refreshToken } });
        if (response.ok) {
            const result = yield* Effect.tryPromise(() =>
                response.json<{
                    accessToken: string;
                    accessTokenMaxAge: number;
                }>()
            );
            cookies.set('access_token', result.accessToken, {
                path: '/',
                httpOnly: true,
                secure: true,
                maxAge: result.accessTokenMaxAge
            });
            return yield* Effect.succeed({ accessToken: result.accessToken });
        }
        return yield* Effect.fail<void>(void 0);
    });

export const decodeAccessToken = (accessToken: string) =>
    Effect.async<{ sub: string }, void>((resume) => {
        verify(accessToken!, certBuffer, { algorithms: ['RS512'] }, (err, decoded) => {
            if (err || typeof decoded?.sub !== 'string') {
                resume(Effect.fail<void>(void 0));
            } else {
                resume(Effect.succeed(decoded as { sub: string }));
            }
        });
    });
