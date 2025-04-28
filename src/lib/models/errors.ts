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

export class InvalidAssetError extends Data.TaggedError('InvalidAssetError') {
    public static readonly instance = new InvalidAssetError();
}

export class NotFoundError extends Data.TaggedError('NotFoundError') {
    public static readonly instance = new NotFoundError();
}

export const errorCodes = {
    unknown: 'unknown',
    aborted: 'aborted_error',
    timeout: 'timeout_error',
    network: 'network_error',
    fromFetch: (e: unknown) => {
        if (e instanceof Error) {
            if (e.name === 'AbortError') {
                return 'aborted_error';
            } else if (e.message.includes('Failed to fetch')) {
                return 'network_error';
            }
        }
        return 'unknown';
    },
    fromJson: (e: unknown) => {
        if (e instanceof SyntaxError) {
            return 'syntax_error';
        }
        return 'parse_error';
    }
} as const;
