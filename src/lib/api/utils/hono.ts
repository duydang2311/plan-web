import { Effect, pipe } from 'effect';
import type { ApiError } from '~/lib/models/errors';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { HonoContext } from '../services/hono_context';
import type { ValidationResult } from '~/lib/utils/validation';

export const HonoResponse = {
    UnknownError: Effect.gen(function* () {
        const c = yield* HonoContext;
        return yield* Effect.fail(c.json({ errors: { root: ['unknown'] } }, { status: 500 }));
    }),
    ValidationError: (errors: Record<string, string[]>) =>
        Effect.gen(function* () {
            const c = yield* HonoContext;
            return yield* Effect.fail(c.json({ errors }, 400));
        }),
    Validation: <T>(validation: ValidationResult<T>) =>
        validation.ok
            ? Effect.succeed(validation)
            : HonoResponse.ValidationError(validation.errors),
    FetchError: (error: ApiError) =>
        Effect.gen(function* () {
            const c = yield* HonoContext;
            return yield* Effect.fail(c.json({ errors: { root: [error.code] } }, { status: 500 }));
        }),
    HTTPError: (response: Response) =>
        Effect.gen(function* () {
            const c = yield* HonoContext;
            if (response.status === 400) {
                const obj = yield* pipe(
                    Effect.tryPromise(() => response.json()),
                    Effect.orElse(() => HonoResponse.UnknownError)
                );
                const problem = yield* pipe(
                    validateProblemDetailsEffect(obj),
                    Effect.mapError((a) => c.json({ errors: { root: [a.code] } }, 500))
                );
                return yield* Effect.fail(
                    c.json({ errors: flattenProblemDetails(problem) }, { status: 400 })
                );
            }
            return yield* Effect.fail(
                c.json({ errors: { root: [response.status + ''] } }, { status: response.status })
            );
        }),
    HTTP: (effect: Effect.Effect<Response, ApiError>) =>
        Effect.gen(function* () {
            const c = yield* HonoContext;
            const response = yield* pipe(
                effect,
                Effect.mapError((e) => c.json({ errors: { root: [e.code] } }, 500))
            );
            if (!response.ok) {
                return yield* HonoResponse.HTTPError(response);
            }
            return response;
        }),
    JSON: <T = unknown>(f: () => Promise<T>) =>
        Effect.gen(function* () {
            const c = yield* HonoContext;
            return yield* pipe(
                Effect.promise(f),
                Effect.tapDefect((e) => Effect.logError('could not convert json', e)),
                Effect.catchAllDefect(() =>
                    Effect.fail(c.json({ errors: { root: ['json'] } }, { status: 400 }))
                ),
                Effect.annotateLogs('scope', 'EndpointResponse.JSON')
            );
        }),
    Die: Effect.gen(function* () {
        const c = yield* HonoContext;
        return yield* Effect.fail(c.json({ errors: { root: ['die'] } }, { status: 500 }));
    })
} as const;
