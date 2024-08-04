import { fail, redirect } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { flattenProblemDetails, type ProblemDetails } from '~/lib/utils/problem_details';
import type { Actions } from './$types';
import { decode, validate } from './utils';

export const actions: Actions = {
    default: async ({ request, cookies, locals: { runtime } }) => {
        const exit = await runtime.runPromiseExit(
            Effect.gen(function* ($) {
                const formData = yield* Effect.promise(() => request.formData());
                const validation = validate(decode(formData));
                if (!validation.ok) {
                    return yield* Effect.fail(fail(400, { errors: validation.errors }));
                }

                return yield* $(
                    Effect.gen(function* () {
                        const apiClient = yield* ApiClient;
                        const response = yield* $(
                            apiClient.post('workspaces', {
                                body: validation.data,
                                headers: {
                                    Authorization: `Bearer ${cookies.get('access_token')}`
                                }
                            }),
                            Effect.catchTag('ApiError', (e) =>
                                Effect.fail(fail(400, { errors: { root: [e.code] } }))
                            )
                        );

                        if (response.ok) {
                            return yield* Effect.promise(() =>
                                response.json<{ id: string; path: string }>()
                            );
                        }

                        if (response.status === 400) {
                            const problemDetails = yield* Effect.promise(() =>
                                response.json<ProblemDetails>()
                            );
                            return yield* Effect.fail(
                                fail(400, { errors: flattenProblemDetails(problemDetails) })
                            );
                        }
                        return yield* Effect.fail(
                            fail(500, { errors: { root: [response.status + ''] } })
                        );
                    })
                );
            })
        );

        return pipe(
            exit,
            Exit.match({
                onSuccess: ({ path }) => redirect(302, path),
                onFailure: (cause) => pipe(cause, Cause.failureOption, Option.getOrThrow)
            })
        );
    }
};
