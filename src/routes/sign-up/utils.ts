import isEmail from 'validator/lib/isEmail';
import { validator } from '~/lib/utils/validation';

export const validate = validator<{
	email: string;
	password: string;
	passwordConfirmation: string;
}>((input, { error }) => {
	if (typeof input !== 'object' || input == null) return error('root', 'invalid_type');
	if (!('email' in input)) return error('email', 'required');
	if (typeof input.email !== 'string' || !isEmail(input.email)) return error('email', 'email');
	if (!('password' in input)) return error('password', 'required');
	if (typeof input.password !== 'string') return error('password', 'string');
	if (input.password.length < 7) return error('password', 'minLength');
	if (!('passwordConfirmation' in input)) return error('passwordConfirmation', 'required');
	if (typeof input.passwordConfirmation !== 'string')
		return error('passwordConfirmation', 'string');
});

export function decode(formData: FormData) {
	return {
		email: (formData.get('email') as string) ?? '',
		password: (formData.get('password') as string) ?? '',
		passwordConfirmation: (formData.get('passwordConfirmation') as string) ?? ''
	};
}
