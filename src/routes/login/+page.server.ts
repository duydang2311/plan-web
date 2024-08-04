import { fail, redirect } from '@sveltejs/kit';
import { Effect, Either, Schedule, pipe } from 'effect';
import { ApiError, ValidationError } from '~/lib/models/errors';
import { ApiClient } from '~/lib/services/api_client.server';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import type { Actions } from './$types';
import { decode, validate } from './utils';

interface SignInResponse {
    accessToken: string;
    refreshToken: string;
    accessTokenMaxAge: number;
    refreshTokenMaxAge: number;
}

export const actions = {
    default: async ({ request, cookies, locals: { appLive } }) => {
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
                onRight: ({ accessToken, refreshToken, accessTokenMaxAge, refreshTokenMaxAge }) => {
                    cookies.set('access_token', accessToken, {
                        path: '/',
                        httpOnly: true,
                        secure: true,
                        sameSite: 'strict',
                        maxAge: accessTokenMaxAge
                    });
                    cookies.set('refresh_token', refreshToken, {
                        path: '/',
                        httpOnly: true,
                        secure: true,
                        sameSite: 'strict',
                        maxAge: refreshTokenMaxAge
                    });
                    return redirect(302, '/');
                }
            })
        );
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
