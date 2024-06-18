type ErrorFunction = (name: string, code: string) => void;

interface ValidatorProps {
	error: ErrorFunction;
}

interface ValidateOk<T> {
	ok: true;
	data: T;
}
interface ValidateFail {
	ok: false;
	errors: Record<string, string[]>;
}

type ValidatorReturn<T> = ValidateOk<T> | ValidateFail;
type Validator<T> = (input: unknown) => ValidatorReturn<T>;
type AsyncValidator<T> = (input: unknown) => PromiseLike<ValidatorReturn<T>>;

type ValidateFunction<T> = (input: T, props: ValidatorProps) => void;
type AsyncValidateFunction<T> = (input: T, props: ValidatorProps) => PromiseLike<void>;

export function validator<T>(validate: AsyncValidateFunction<unknown>): AsyncValidator<T>;
export function validator<T>(validate: ValidateFunction<unknown>): Validator<T>;
export function validator<T>(
	validate: ValidateFunction<unknown> | AsyncValidateFunction<unknown>
): Validator<T> | AsyncValidator<T> {
	return ((input: unknown) => validateInternal<unknown, T>(input, validate)) as
		| Validator<T>
		| AsyncValidator<T>;
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
		if (isPromiseLike<ValidatorReturn<T>>(ret)) {
			return ret.then((validated) =>
				validated.ok ? validateInternal<T, TNew>(validated.data, validate) : validated
			);
		}
		return ret.ok ? validateInternal<T, TNew>(ret.data, validate) : ret;
	}) as Validator<TNew> | AsyncValidator<TNew>;
}

function addError(errors: Record<string, string[]>, name: string, code: string) {
	if (errors[name]) {
		errors[name]?.push(code);
	} else {
		errors[name] = [code];
	}
}

function isPromiseLike<T>(input: unknown): input is PromiseLike<T> {
	return input instanceof Promise;
}

function validateInternal<TIn, TOut = TIn>(
	input: TIn,
	validate: ValidateFunction<TIn> | AsyncValidateFunction<TIn>
): MaybePromise<ValidatorReturn<TOut>> {
	const errors: Record<string, string[]> = {};
	const ret = validate(input, {
		error: (name: string, code: string) => addError(errors, name, code)
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
