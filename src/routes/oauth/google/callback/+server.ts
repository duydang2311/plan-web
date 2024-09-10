import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { Cause, Data, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { EndpointResponse } from '~/lib/utils/kit';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import type { RequestHandler } from './$types';

class UnregisteredError extends Data.TaggedError('UnregisteredError') {}

export const GET: RequestHandler = async ({ cookies, url, fetch, locals: { runtime } }) => {
    const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
            const googleOAuthState = cookies.get('google_oauth_state');
            if (!googleOAuthState) {
                return yield* Effect.fail(
                    json({ errors: ['google_oauth_state'] }, { status: 400 })
                );
            }

            const state = url.searchParams.get('state');
            if (state !== googleOAuthState) {
                return yield* Effect.fail(json({ errors: ['state'] }, { status: 400 }));
            }

            const code = url.searchParams.get('code');
            if (!code) {
                return yield* Effect.fail(json({ errors: ['code'] }, { status: 400 }));
            }

            const response = yield* Effect.tryPromise({
                try: () =>
                    fetch('https://oauth2.googleapis.com/token', {
                        method: 'post',
                        body: JSON.stringify({
                            code: code,
                            client_id: env.GOOGLE_OAUTH_CLIENT_ID,
                            client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
                            redirect_uri: `${url.origin}/oauth/google/callback`,
                            grant_type: `authorization_code`
                        }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }),
                catch: () => json({ errors: ['fetch'] }, { status: 500 })
            });

            if (!response.ok) {
                return yield* Effect.fail(
                    json({ errors: [response.status + ''] }, { status: response.status })
                );
            }
            return yield* EndpointResponse.JSON(() => response.json<{ id_token: string }>());
        })
    );

    if (Exit.isFailure(exit)) {
        return new Response(null, { status: 400 });
    }

    const authExit = await runtime.runPromiseExit(
        pipe(
            signInWithGoogle(exit.value.id_token),
            Effect.catchTag('UnregisteredError', () =>
                Effect.gen(function* () {
                    yield* signUpWithGoogle(exit.value.id_token);
                    return yield* pipe(signInWithGoogle(exit.value.id_token));
                })
            ),
            Effect.catchTags({
                UnregisteredError: () =>
                    Effect.fail(json({ errors: { root: ['unregistered'] } }, { status: 400 })),
                ApiError: (e) => Effect.fail(json({ errors: { root: [e.code] } }, { status: 400 }))
            })
        )
    );

    if (Exit.isFailure(authExit)) {
        return pipe(authExit.cause, Cause.failureOption, Option.getOrThrow);
    }

    cookies.set('access_token', authExit.value.accessToken, {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: authExit.value.accessTokenMaxAge
    });
    cookies.set('refresh_token', authExit.value.refreshToken, {
        path: '/',
        httpOnly: true,
        secure: true,
        maxAge: authExit.value.refreshTokenMaxAge
    });
    return new Response(null, { status: 302, headers: { Location: '/' } });
};

const signInWithGoogle = (idToken: string) =>
    Effect.gen(function* () {
        const api = yield* ApiClient;
        const response = yield* api.post('tokens/authenticate/google', {
            body: { idToken }
        });

        if (!response.ok) {
            if (response.status === 400) {
                const obj = yield* EndpointResponse.JSON(() => response.json());
                const problem = yield* pipe(
                    validateProblemDetailsEffect(obj),
                    Effect.mapError((a) => json({ errors: { root: [a.code] } }, { status: 500 }))
                );
                if (
                    problem.errors != null &&
                    problem.errors.some((a) => a.code === 'unregistered')
                ) {
                    return yield* Effect.fail(new UnregisteredError());
                }
                return yield* Effect.fail(
                    json({ errors: flattenProblemDetails(problem) }, { status: 400 })
                );
            }
            return yield* EndpointResponse.HTTPError(response);
        }
        return yield* EndpointResponse.JSON(() =>
            response.json<{
                accessToken: string;
                refreshToken: string;
                accessTokenMaxAge: number;
                refreshTokenMaxAge: number;
            }>()
        );
    });

const signUpWithGoogle = (idToken: string) =>
    Effect.gen(function* () {
        const api = yield* ApiClient;
        return yield* EndpointResponse.HTTP(
            api.post('users/google', {
                body: { idToken }
            })
        );
    });
