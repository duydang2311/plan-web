import { Effect, pipe } from 'effect';
import Elysia, { type ElysiaConfig } from 'elysia';
import type { ApiError, ValidationError } from '~/lib/models/errors';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import type { ValidationResult } from '~/lib/utils/validation';
import { ErrorFn } from '../contexts';
import type { BaseApp } from '../server';

export const baseApp = <BasePath extends string>(
    config?: ElysiaConfig<BasePath, BaseApp['_types']['Scoped']>
) =>
    new Elysia<
        BasePath,
        BaseApp['_types']['Scoped'],
        BaseApp['_types']['Singleton'],
        BaseApp['_types']['Definitions'],
        BaseApp['_types']['Metadata'],
        BaseApp['_routes'],
        BaseApp['_ephemeral'],
        BaseApp['_volatile']
    >(config);

export const ElysiaResponse = {
    UnknownError: () =>
        pipe(
            ErrorFn,
            Effect.andThen((error) => Effect.fail(error(500, { errors: { $: ['unknown'] } })))
        ),
    ValidationError: (e: ValidationError) =>
        pipe(
            ErrorFn,
            Effect.andThen((error) => Effect.fail(error(400, { errors: e.errors })))
        ),
    Validation: <T>(e: ValidationResult<T>) =>
        Effect.gen(function* () {
            const error = yield* ErrorFn;
            if (!e.ok) {
                return yield* Effect.fail(error(400, { errors: e.errors }));
            }
            return e;
        }),
    UnauthorizedError: () =>
        pipe(
            ErrorFn,
            Effect.andThen((error) => Effect.fail(error(401)))
        ),
    FetchError: (e: ApiError) =>
        pipe(
            ErrorFn,
            Effect.andThen((error) => Effect.fail(error(500, { errors: { $: [e.code] } })))
        ),
    HTTPError: (response: Response) =>
        Effect.gen(function* () {
            const error = yield* ErrorFn;
            if (response.status === 400) {
                const obj = yield* pipe(
                    Effect.tryPromise(() => response.json()),
                    Effect.orElse(ElysiaResponse.UnknownError)
                );
                const problem = yield* pipe(
                    validateProblemDetailsEffect(obj),
                    Effect.mapError((a) => error(500, { errors: { $: [a.code] } }))
                );
                return yield* Effect.fail(error(400, { errors: flattenProblemDetails(problem) }));
            }
            return yield* Effect.fail(
                error(response.status, { errors: { $: [response.status + ''] } })
            );
        }),
    HTTP: (effect: Effect.Effect<Response, ApiError>) =>
        Effect.gen(function* () {
            const error = yield* ErrorFn;
            const response = yield* pipe(
                effect,
                Effect.mapError((e) => error(500, { errors: { $: [e.code] } }))
            );
            if (!response.ok) {
                return yield* ElysiaResponse.HTTPError(response);
            }
            return response;
        }),
    JSON: <T = unknown>(f: () => Promise<T>) =>
        pipe(
            ErrorFn,
            Effect.flatMap((error) =>
                Effect.tryPromise({
                    try: f,
                    catch: () => error(500, { errors: { $: ['json'] } })
                })
            )
        ),
    Die: () =>
        pipe(
            ErrorFn,
            Effect.flatMap((error) => Effect.fail(error(500, { errors: { $: ['die'] } })))
        )
} as const;
