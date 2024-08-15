import { invalidate } from '$app/navigation';
import { Effect } from 'effect';
import { validateProblemDetailsEffect, flattenProblemDetails } from './problem_details';
import { fail, json } from '@sveltejs/kit';
import type { ApiError } from '../models/errors';
import type { ValidationResult } from './validation';

export function invalidateSome(...hrefs: string[]) {
    return invalidate((url) => {
        return hrefs.includes(url.href);
    });
}

export const ActionResponse = {
    UnknownError: () => Effect.fail(fail(500, { errors: { root: ['unknown'] } })),
    ValidationError: (errors: Record<string, string[]>) => Effect.fail(fail(400, { errors })),
    Validation: <T>(validation: ValidationResult<T>) =>
        validation.ok
            ? Effect.succeed(validation)
            : ActionResponse.ValidationError(validation.errors),
    FetchError: (error: ApiError) => Effect.fail(fail(500, { errors: { root: [error.code] } })),
    HTTPError: (response: Response) =>
        Effect.gen(function* () {
            if (response.status === 400) {
                const json = yield* Effect.tryPromise(() => response.json());
                const problem = yield* validateProblemDetailsEffect(json);
                return yield* Effect.fail(fail(400, { errors: flattenProblemDetails(problem) }));
            }
            return yield* Effect.fail(
                fail(response.status, { errors: { root: [response.status + ''] } })
            );
        })
} as const;

export const EndpointResponse = {
    UnknownError: () => Effect.fail(json({ errors: { root: ['unknown'] } }, { status: 500 })),
    ValidationError: (errors: Record<string, string[]>) =>
        Effect.fail(json({ errors }, { status: 500 })),
    FetchError: (error: ApiError) =>
        Effect.fail(json({ errors: { root: [error.code] } }, { status: 500 })),
    HTTPError: (response: Response) =>
        Effect.gen(function* () {
            if (response.status === 400) {
                const obj = yield* Effect.tryPromise(() => response.json());
                const problem = yield* validateProblemDetailsEffect(obj);
                return yield* Effect.fail(
                    json({ errors: flattenProblemDetails(problem) }, { status: 400 })
                );
            }
            return yield* Effect.fail(
                json({ errors: { root: [response.status + ''] } }, { status: response.status })
            );
        })
} as const;
