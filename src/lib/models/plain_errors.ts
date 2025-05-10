export class HttpError extends Error {
    public status: number;

    constructor({ status, message }: { status: number; message?: string }) {
        super(message);

        Object.setPrototypeOf(this, HttpError.prototype);

        this.status = status;
        this.name = this.constructor.name;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
