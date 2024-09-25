import { Effect, pipe } from 'effect';
import type { ApiError } from '~/lib/models/errors';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { HonoContext } from '../services/hono_context';
import type { ValidationResult } from '~/lib/utils/validation';

type HonoResponse<T> = ErrorResponse | SuccessResponse<T>;

interface ErrorResponse {
    type: 'error';
    errors: Record<string, string[]>;
    data?: never;
}

interface SuccessResponse<T> {
    type: 'success';
    data: T;
    errors?: never;
}

export function err(errors: Record<string, string[]>): ErrorResponse {
    return { type: 'error', errors };
}

export function success<T>(data: T): SuccessResponse<T> {
    return { type: 'success', data };
}

export const HonoResponse = {
    UnknownError: Effect.gen(function* () {
        const c = yield* HonoContext;
        return yield* Effect.fail(c.json(err({ root: ['unknown'] }), 500));
    }),
    ValidationError: (errors: Record<string, string[]>) =>
        Effect.gen(function* () {
            const c = yield* HonoContext;
            return yield* Effect.fail(c.json(err(errors), 400));
        }),
    Validation: <T>(validation: ValidationResult<T>) =>
        Effect.gen(function* () {
            return validation.ok
                ? validation
                : yield* HonoResponse.ValidationError(validation.errors);
        }),
    FetchError: (error: ApiError) =>
        Effect.gen(function* () {
            const c = yield* HonoContext;
            return yield* Effect.fail(c.json(err({ root: [error.code] }), 500));
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
                    Effect.mapError((a) => c.json(err({ root: [a.code] }), 500))
                );
                return yield* Effect.fail(c.json(err(flattenProblemDetails(problem)), 400));
            }
            return yield* Effect.fail(
                c.json(err({ root: [response.status + ''] }), { status: response.status })
            );
        }),
    HTTP: (effect: Effect.Effect<Response, ApiError>) =>
        Effect.gen(function* () {
            const c = yield* HonoContext;
            const response = yield* pipe(
                effect,
                Effect.mapError((e) => c.json(err({ root: [e.code] }), 500))
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
                Effect.catchAllDefect(() => Effect.fail(c.json(err({ root: ['json'] }), 400))),
                Effect.annotateLogs('scope', 'EndpointResponse.JSON')
            );
        }),
    Die: Effect.gen(function* () {
        const c = yield* HonoContext;
        return yield* Effect.fail(c.json(err({ root: ['die'] }), 500));
    })
} as const;
