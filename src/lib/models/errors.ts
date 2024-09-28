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

export class HttpError extends Data.TaggedError('HttpError')<{
    status: number;
    message?: string;
}> {
    public static from(response: Response) {
        return new HttpError({ status: response.status, message: response.statusText });
    }
}

export class ValidationError extends Data.TaggedError('ValidationError')<{
    errors: Record<string, string[]>;
}> {
    public static of(errors: Record<string, string[]>) {
        return new ValidationError({ errors });
    }
}

export class UnauthorizedError extends Data.TaggedError('UnauthorizedError') {
    public static readonly instance = new UnauthorizedError();
}
