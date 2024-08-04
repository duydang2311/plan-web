import { Data } from 'effect';

export class ApiError extends Data.TaggedError('ApiError')<{
    code: string;
    message?: string;
    cause?: unknown;
    stack?: string;
}> {}
// 	public readonly _tag = 'AppError';
// 	public readonly code: string;

// 	constructor({
// 		code,
// 		message,
// 		cause,
// 		stack
// 	}: {
// 		code: string;
// 		message?: string;
// 		cause?: unknown;
// 		stack?: string;
// 	}) {
// 		super(message, { cause });
// 		this.code = code;
// 		this.name = 'AppError';
// 		if (stack) {
// 			this.stack = stack;
// 		}
// 		Object.setPrototypeOf(this, AppError.prototype);
// 	}

// 	public toString() {
// 		return `${this.name}: ${this.message} (${this.code})`;
// 	}
// }

export class ValidationError extends Data.TaggedError('ValidationError')<{
    errors: Record<string, string[]>;
}> {}
// 	public readonly _tag = 'ValidationError';
// 	public readonly errors: Record<string, string[]>;

// 	constructor({
// 		errors,
// 		message,
// 		cause,
// 		stack
// 	}: {
// 		errors: Record<string, string[]>;
// 		message?: string;
// 		cause?: unknown;
// 		stack?: string;
// 	}) {
// 		super(message, { cause });
// 		this.errors = errors;
// 		this.name = 'ValidationError';
// 		if (stack) {
// 			this.stack = stack;
// 		}
// 		Object.setPrototypeOf(this, ValidationError.prototype);
// 	}

// 	public toString() {
// 		return `${this.name}: ${this.message} (${inspect(this.errors)})`;
// 	}
// }
