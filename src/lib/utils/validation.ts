type ErrorFunction = (name: string, code: string) => void;

interface ValidatorProps {
	error: ErrorFunction;
}

type Validator<T> = (
	input: unknown
) => { ok: true; data: T } | { ok: false; errors: Record<string, string[]> };

export function extend<T, TNew = T>(
	validator: Validator<T>,
	validate: (input: T, props: ValidatorProps) => void
): Validator<TNew> {
	return (input: unknown) => {
		const validated = validator(input);
		if (!validated.ok) {
			return validated;
		}
		const errors: Record<string, string[]> = {};
		function error(name: string, code: string) {
			if (errors[name]) {
				errors[name].push(code);
			} else {
				errors[name] = [code];
			}
		}
		validate(validated.data, { error });
		for (const _ in errors) {
			return { ok: false, errors } as const;
		}
		return { ok: true, data: input as TNew } as const;
	};
}

export function validator<T>(
	validate: (input: unknown, props: ValidatorProps) => void
): Validator<T> {
	return (input: unknown) => {
		const errors: Record<string, string[]> = {};
		function error(name: string, code: string) {
			if (errors[name]) {
				errors[name].push(code);
			} else {
				errors[name] = [code];
			}
		}
		validate(input, { error });
		for (const _ in errors) {
			return { ok: false, errors } as const;
		}
		return { ok: true, data: input as T } as const;
	};
}

export function flatValidator<T>(
	validate: (input: unknown, props: ValidatorProps) => void
): (
	input: unknown
) => { ok: true; data: T } | { ok: false; errors: { name: string; code: string }[] } {
	return (input: unknown) => {
		const errors: { name: string; code: string }[] = [];
		function error(name: string, code: string) {
			errors.push({ name, code });
		}
		validate(input, { error });
		if (errors.length) {
			return { ok: false, errors } as const;
		}
		return { ok: true, data: input as T } as const;
	};
}
