import type { Static, TSchema } from '@sinclair/typebox';
import { TypeCheck, TypeCompiler } from '@sinclair/typebox/compiler';
import { Value, ValueErrorType } from '@sinclair/typebox/value';
import { isEmptyObject } from './commons';

interface ErrorFunction {
    (name: string, code: string): void;
    (errors: Record<string, string[]>): void;
}

interface ValidatorProps {
    error: ErrorFunction;
}

export interface ValidateOk<T> {
    ok: true;
    data: T;
}

export interface ValidateFail {
    ok: false;
    errors: Record<string, string[]>;
}

export type ValidationResult<T = unknown> = ValidateOk<T> | ValidateFail;
export type Validator<T> = (input: unknown) => ValidationResult<T>;
export type AsyncValidator<T> = (input: unknown) => PromiseLike<ValidationResult<T>>;

type ValidateFunction<T> = (input: T, props: ValidatorProps) => void;
type AsyncValidateFunction<T> = (input: T, props: ValidatorProps) => PromiseLike<void>;

interface TypeBoxValidatorOptions {
    stripLeadingSlash?: boolean;
    convert?: boolean;
}

export function validator<T extends TSchema>(
    schema: T,
    options?: TypeBoxValidatorOptions
): Validator<Static<T>>;
export function validator<T>(validate: AsyncValidateFunction<unknown>): AsyncValidator<T>;
export function validator<T>(validate: ValidateFunction<unknown>): Validator<T>;
export function validator(
    validate: ValidateFunction<unknown> | AsyncValidateFunction<unknown> | TSchema,
    options?: TypeBoxValidatorOptions
) {
    if (typeof validate === 'function') {
        return (input: unknown) => validateInternal(input, validate);
    }
    return validatorFromType(validate, options);
}

export function extend<T, TNew = T>(
    validator: AsyncValidator<T>,
    validate: AsyncValidateFunction<T> | ValidateFunction<T>
): AsyncValidator<TNew>;
export function extend<T, TNew = T>(
    validator: Validator<T>,
    validate: AsyncValidateFunction<T>
): AsyncValidator<TNew>;
export function extend<T, TNew = T>(
    validator: Validator<T>,
    validate: ValidateFunction<T>
): Validator<TNew>;

export function extend<T, TNew = T>(
    validator: Validator<T> | AsyncValidator<T>,
    validate: ValidateFunction<T> | AsyncValidateFunction<T>
): Validator<TNew> | AsyncValidator<TNew> {
    return ((input: unknown) => {
        const ret = validator(input);
        if (isPromiseLike<ValidationResult<T>>(ret)) {
            return ret.then((validated) =>
                validated.ok ? validateInternal<T, TNew>(validated.data, validate) : validated
            );
        }
        return ret.ok ? validateInternal<T, TNew>(ret.data, validate) : ret;
    }) as Validator<TNew> | AsyncValidator<TNew>;
}

const typeCompilers = new Map<TSchema, TypeCheck<TSchema>>();
function validatorFromType<T extends TSchema>(
    schema: T,
    { stripLeadingSlash = false, convert = false }: TypeBoxValidatorOptions = {}
): Validator<Static<T>> {
    return (input) => {
        let compiler = typeCompilers.get(schema);
        if (!compiler) {
            compiler = TypeCompiler.Compile(schema);
            typeCompilers.set(schema, TypeCompiler.Compile(schema));
        }

        if (convert) {
            input = Value.Convert(schema, input);
        }
        const errors: Record<string, string[]> = {};
        for (const error of compiler.Errors(input)) {
            let path = error.path.length === 0 ? '/' : error.path;
            if (stripLeadingSlash) {
                path = path.substring(1);
            }
            const slashIndex = path.indexOf('/', stripLeadingSlash ? 0 : 1);
            path = path.substring(0, slashIndex === -1 ? undefined : slashIndex);
            if (!errors[path]) {
                errors[path] = [ValueErrorType[error.type]];
            } else {
                errors[path].push(ValueErrorType[error.type]);
            }
        }
        return isEmptyObject(errors) ? { ok: true, data: input } : { ok: false, errors };
    };
}

function addError(
    errors: Record<string, string[]>,
    nameOrErrors: string | Record<string, string[]>,
    code?: string
) {
    if (typeof nameOrErrors === 'string') {
        if (errors[nameOrErrors]) {
            errors[nameOrErrors].push(code!);
        } else {
            errors[nameOrErrors] = [code!];
        }
    } else {
        for (const [k, vs] of Object.entries(nameOrErrors)) {
            for (const v of vs) {
                if (errors[k]) {
                    errors[k].push(v);
                } else {
                    errors[k] = [v];
                }
            }
        }
    }
}

function isPromiseLike<T>(input: unknown): input is PromiseLike<T> {
    return input instanceof Promise;
}

function validateInternal<TIn, TOut = TIn>(
    input: TIn,
    validate: ValidateFunction<TIn> | AsyncValidateFunction<TIn>
): MaybePromise<ValidationResult<TOut>> {
    const errors: Record<string, string[]> = {};
    const ret = validate(input, {
        error: (nameOrErrors, code?) => addError(errors, nameOrErrors, code as string)
    });
    if (ret instanceof Promise) {
        return ret.then(() => {
            for (const _ in errors) {
                return { ok: false, errors };
            }
            return { ok: true, data: input as unknown as TOut };
        });
    }
    for (const _ in errors) {
        return { ok: false, errors };
    }
    return { ok: true, data: input as unknown as TOut };
}
