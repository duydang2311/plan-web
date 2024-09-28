import { Context, Layer } from 'effect';
import { error } from 'elysia';

export class ErrorFn extends Context.Tag('@plan/error-fn')<ErrorFn, typeof error>() {}

export const ErrorFnLive = Layer.sync(ErrorFn, () => error);
