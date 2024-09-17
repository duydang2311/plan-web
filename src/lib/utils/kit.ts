import { invalidate } from '$app/navigation';
import { fail, json } from '@sveltejs/kit';
import { Effect, pipe } from 'effect';
import type { ApiError } from '../models/errors';
import { flattenProblemDetails, validateProblemDetailsEffect } from './problem_details';
import type { ValidationResult } from './validation';

export function invalidateSome(...hrefs: string[]) {
    return invalidate((url) => {
        return hrefs.includes(url.href);
    });
}

type A =
    | {
          readonly status: 500;
          readonly code: 'unknown';
          readonly message: 'An unknown error occurred';
      }
    | {
          readonly status: 500;
          readonly code: string;
          readonly message: string;
      };

export const LoadResponse = {
    UnknownError: () =>
        Effect.fail({
            _tag: 'UnknownError',
            status: 500,
            code: 'unknown',
            message: 'An unknown error occurred'
        } as const),
    FetchError: (e: ApiError) =>
        Effect.fail({ _tag: 'FetchError', status: 500, code: e.code, message: e.message } as const),
    HTTPError: (response: Response) =>
        Effect.fail({
            _tag: 'HTTPError',
            status: response.status,
            code: 'http',
            message: response.statusText
        } as const),
    HTTP: (effect: Effect.Effect<Response, ApiError>) =>
        Effect.gen(function* () {
            const response = yield* pipe(
                effect,
                Effect.mapError(
                    (e) =>
                        ({
                            _tag: 'FetchError',
                            status: 500,
                            code: e.code,
                            message: e.message
                        }) as const
                )
            );
            if (!response.ok) {
                return yield* LoadResponse.HTTPError(response);
            }
            return response;
        }),
    JSON: <T = unknown>(f: () => Promise<T>) =>
        Effect.tryPromise({
            try: f,
            catch: () =>
                ({
                    _tag: 'JSONError',
                    status: 500,
                    code: 'json',
                    message: 'Could not parse JSON'
                }) as const
        })
} as const;

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
                const json = yield* ActionResponse.JSON(() => response.json());
                const problem = yield* validateProblemDetailsEffect(json);
                return yield* Effect.fail(fail(400, { errors: flattenProblemDetails(problem) }));
            }
            return yield* Effect.fail(
                fail(response.status, { errors: { root: [response.status + ''] } })
            );
        }),
    HTTP: (effect: Effect.Effect<Response, ApiError>) =>
        Effect.gen(function* () {
            const response = yield* pipe(
                effect,
                Effect.mapError((a) => json({ errors: { root: [a.code] } }))
            );
            if (!response.ok) {
                return yield* ActionResponse.HTTPError(response);
            }
            return response;
        }),
    JSON: <T = unknown>(f: () => Promise<T>) =>
        pipe(
            Effect.tryPromise({
                try: f,
                catch: (e) => e
            }),
            Effect.tapError((e) => Effect.logError('could not parse json', e)),
            Effect.mapError(() => fail(500, { errors: { root: ['json'] } })),
            Effect.annotateLogs('scope', 'ActionResponse.JSON')
        ),
    FormData: (f: () => Promise<FormData>) =>
        pipe(
            Effect.tryPromise({
                try: f,
                catch: (e) => e
            }),
            Effect.tapError((e) => Effect.logError('could not parse form data', e)),
            Effect.mapError(() => fail(500, { errors: { root: ['form_data'] } })),
            Effect.annotateLogs('scope', 'ActionResponse.FormData')
        )
} as const;

export const EndpointResponse = {
    UnknownError: () => Effect.fail(json({ errors: { root: ['unknown'] } }, { status: 500 })),
    ValidationError: (errors: Record<string, string[]>) =>
        Effect.fail(json({ errors }, { status: 400 })),
    Validation: <T>(validation: ValidationResult<T>) =>
        validation.ok
            ? Effect.succeed(validation)
            : EndpointResponse.ValidationError(validation.errors),
    FetchError: (error: ApiError) =>
        Effect.fail(json({ errors: { root: [error.code] } }, { status: 500 })),
    HTTPError: (response: Response) =>
        Effect.gen(function* () {
            if (response.status === 400) {
                const obj = yield* pipe(
                    Effect.tryPromise(() => response.json()),
                    Effect.orElse(EndpointResponse.UnknownError)
                );
                const problem = yield* pipe(
                    validateProblemDetailsEffect(obj),
                    Effect.mapError((a) => json({ errors: { root: [a.code] } }))
                );
                return yield* Effect.fail(
                    json({ errors: flattenProblemDetails(problem) }, { status: 400 })
                );
            }
            return yield* Effect.fail(
                json({ errors: { root: [response.status + ''] } }, { status: response.status })
            );
        }),
    HTTP: (effect: Effect.Effect<Response, ApiError>) =>
        Effect.gen(function* () {
            const response = yield* pipe(
                effect,
                Effect.mapError((a) => json({ errors: { root: [a.code] } }))
            );
            if (!response.ok) {
                return yield* EndpointResponse.HTTPError(response);
            }
            return response;
        }),
    JSON: <T = unknown>(f: () => Promise<T>) =>
        pipe(
            Effect.promise(f),
            Effect.tapDefect((e) => Effect.logError('could not convert json', e)),
            Effect.catchAllDefect(() =>
                Effect.fail(json({ errors: { root: ['json'] } }, { status: 400 }))
            ),
            Effect.annotateLogs('scope', 'EndpointResponse.JSON')
        )
} as const;
