import { Data } from 'effect';

export class GenericError extends Data.TaggedError('GenericError')<{
    code: string;
    message?: string;
}> {}

export class ApiError extends Data.TaggedError('ApiError')<{
    code: string;
    message?: string;
    cause?: unknown;
    stack?: string;
}> {}

export class ValidationError extends Data.TaggedError('ValidationError')<{
    errors: Record<string, string[]>;
}> {}
