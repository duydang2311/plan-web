import { validator } from '~/lib/utils/validation';

export const validate = validator<{ name: string; identifier: string }>((input, { error }) => {
	if (typeof input !== 'object' || input == null) return error('root', 'object');
	if (!('name' in input) || typeof input.name !== 'string') return error('name', 'required');
	const name = input.name.trim();
	if (name.length === 0) return error('name', 'required');
	if (!('identifier' in input) || typeof input.identifier !== 'string')
		return error('identifier', 'required');

	const identifier = input.identifier.trim();
	if (identifier.length === 0) return error('identifier', 'required');
	if (identifier.length > 5) return error('identifier', 'maxLength');

	input.name = name;
	input.identifier = identifier;
});

export const decode = (formData: FormData) => {
	return {
		name: formData.get<string>('name') ?? '',
		identifier: formData.get<string>('identifier') ?? ''
	};
};
