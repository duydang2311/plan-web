import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { timingSafeEqual } from 'crypto';
import { Effect, Either, Schedule, pipe } from 'effect';
import { ApiError, ValidationError } from '~/lib/models/errors';
import { ApiClient } from '~/lib/services/api_client.server';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { extend } from '~/lib/utils/validation';
import type { Actions } from './$types';
import { decode, validate } from './utils';

const serverValidate = extend(validate, (input, { error }) => {
    if (
        input.password.length !== input.passwordConfirmation.length ||
        !timingSafeEqual(Buffer.from(input.password), Buffer.from(input.passwordConfirmation))
    ) {
        error('password', 'confirmed');
        error('passwordConfirmation', 'confirmed');
    }
});

export const actions = {
    default: async ({ request, locals: { appLive } }) => {
        return pipe(
            await Effect.runPromise(
                Effect.gen(function* ($) {
                    const formData = yield* Effect.promise(() => request.formData());
                    const validation = serverValidate(decode(formData));
                    if (!validation.ok) {
                        return yield* Effect.fail(fail(400, { errors: validation.errors }));
                    }

                    return yield* Effect.either(
                        $(
                            signUpEffect(validation.data.email, validation.data.password),
                            Effect.catchTag('ApiError', (e) =>
                                Effect.fail(
                                    fail(400, {
                                        errors: { root: [e.code] }
                                    })
                                )
                            ),
                            Effect.catchTag('ValidationError', (e) =>
                                Effect.fail(
                                    fail(400, {
                                        errors: e.errors
                                    })
                                )
                            ),
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
                onRight: (r) => ({ email: r })
            })
        );
    }
} satisfies Actions;

function signUpEffect(email: string, password: string) {
    return Effect.gen(function* () {
        const apiClient = yield* ApiClient;
        const response = yield* apiClient.post('users', {
            body: { email, password, verificationUrl: env.VERIFICATION_URL }
        });
        if (!response.ok) {
            const json = yield* Effect.tryPromise({
                try: () => response.json(),
                catch: () => new ApiError({ code: response.status + '' })
            });
            const problem = yield* validateProblemDetailsEffect(json);
            return yield* Effect.fail(
                new ValidationError({
                    errors: flattenProblemDetails(problem)
                })
            );
        }
        return yield* Effect.succeed(email);
    });
}
