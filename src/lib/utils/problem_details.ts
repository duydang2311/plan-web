import { Array, Effect, pipe } from 'effect';
import { validator } from './validation';
import { ApiError } from '../models/errors';

export interface ProblemDetails {
    type: string;
    title: string;
    status: number;
    detail?: string;
    instance?: string;
    traceId?: string;
    errors?: { name: string; reason: string; code?: string }[];
}

export const validateProblemDetails = validator<ProblemDetails>((input, { error }) => {
    if (typeof input !== 'object' || input == null) {
        error('root', 'object');
        return;
    }
    if (!('type' in input) || typeof input.type !== 'string') {
        error('type', 'string');
    }
    if (!('title' in input) || typeof input.title !== 'string') {
        error('title', 'string');
    }
    if (!('status' in input) || typeof input.status !== 'number') {
        error('status', 'number');
    }
    if ('detail' in input && typeof input.detail !== 'string') {
        error('detail', 'string');
    }
    if ('instance' in input && typeof input.instance !== 'string') {
        error('instance', 'string');
    }
    if ('traceId' in input && typeof input.traceId !== 'string') {
        error('traceId', 'string');
    }
    if ('errors' in input) {
        if (!Array.isArray(input.errors)) {
            error('errors', 'array');
        } else {
            for (const i in input.errors) {
                const e = input.errors[i];
                if (typeof e !== 'object' || e == null) {
                    error(`errors[${i}]`, 'object');
                    continue;
                }
                if (!('name' in e) || typeof e.name !== 'string') {
                    error(`errors[${i}].name`, 'string');
                }
                if (!('reason' in e) || typeof e.reason !== 'string') {
                    error(`errors[${i}].reason`, 'string');
                }
                if ('code' in e && typeof e.code !== 'string') {
                    error(`errors[${i}].code`, 'string');
                }
            }
        }
    }
});

export function validateProblemDetailsEffect(input: unknown) {
    return pipe(
        Effect.sync(() => validateProblemDetails(input)),
        Effect.flatMap((a) =>
            a.ok
                ? Effect.succeed(a.data)
                : Effect.fail(new ApiError({ code: 'problem_details_validation' }))
        )
    );
}

export function flattenProblemDetails({ errors }: ProblemDetails) {
    if (!errors) return {};
    return pipe(
        errors,
        Array.reduce({} as Record<string, string[]>, (acc, cur) => {
            if (!acc[cur.name]) {
                acc[cur.name] = [cur.code ?? cur.reason];
            } else {
                acc[cur.name].push(cur.code ?? cur.reason);
            }
            return acc;
        })
    );
}
