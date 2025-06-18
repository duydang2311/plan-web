import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import { Effect, Either, Schedule, pipe } from 'effect';
import crypto from 'node:crypto';
import { ApiError, ValidationError } from '~/lib/models/errors';
import { ApiClient } from '~/lib/services/api_client.server';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import type { Actions, PageServerLoad } from './$types';
import { decode, validate } from './utils';

interface SignInResponse {
    sessionId: string;
    sessionMaxAge: number;
}

export const load: PageServerLoad = async ({ cookies }) => {
    const flashVerified = cookies.get('flash_verified');
    if (flashVerified) {
        cookies.delete('flash_verified', { path: '/' });
    }

    return { flashVerified: flashVerified != null };
};

export const actions = {
    'sign-in': async ({ request, cookies, locals: { appLive } }) => {
        return pipe(
            await Effect.runPromise(
                Effect.gen(function* ($) {
                    const formData = yield* Effect.promise(() => request.formData());
                    const input = decode(formData);
                    const validated = validate(input);
                    if (!validated.ok) {
                        return yield* Effect.fail(fail(400, { errors: validated.errors }));
                    }
                    return yield* Effect.either(
                        $(
                            signInEffect(validated.data.email, validated.data.password),
                            Effect.catchTags({
                                ApiError: (e) =>
                                    Effect.fail(fail(400, { errors: { root: [e.code] } })),
                                ValidationError: (e) => Effect.fail(fail(400, { errors: e.errors }))
                            }),
                            Effect.provide(appLive),
                            Effect.retry({
                                schedule: Schedule.addDelay(Schedule.recurs(3), () => '2 seconds'),
                                while: (e) =>
                                    'root' in e.data.errors &&
                                    e.data.errors.root.includes('unknown')
                            })
                        )
                    );
                })
            ),
            Either.match({
                onLeft: (l) => l,
                onRight: ({ sessionId, sessionMaxAge }) => {
                    cookies.set('plan_session', sessionId, {
                        path: '/',
                        httpOnly: true,
                        secure: true,
                        sameSite: 'lax',
                        maxAge: sessionMaxAge
                    });
                    return redirect(302, '/');
                }
            })
        );
    },
    'google-sign-in': ({ url, cookies }) => {
        const state = crypto.randomBytes(32).toString('hex');
        cookies.set('google_oauth_state', state, {
            path: '/oauth/google/callback',
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 10
        });

        const authUrl = new URL(`https://accounts.google.com/o/oauth2/v2/auth`);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('client_id', env.GOOGLE_OAUTH_CLIENT_ID);
        authUrl.searchParams.set('scope', 'openid email profile');
        authUrl.searchParams.set('redirect_uri', `${url.origin}/oauth/google/callback`);
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('nonce', crypto.randomBytes(32).toString('hex'));
        return redirect(302, authUrl);
    }
} satisfies Actions;

function signInEffect(email: string, password: string) {
    return Effect.gen(function* () {
        const apiClient = yield* ApiClient;
        const response = yield* apiClient.post('tokens/authenticate', {
            body: { email, password }
        });
        if (!response.ok) {
            const json = yield* Effect.tryPromise({
                try: () => response.json<unknown>(),
                catch: () => new ApiError({ code: response.status + '' })
            });
            const problem = yield* validateProblemDetailsEffect(json);
            return yield* Effect.fail(
                new ValidationError({ errors: flattenProblemDetails(problem) })
            );
        }
        return yield* Effect.promise(() => response.json<SignInResponse>());
    });
}
