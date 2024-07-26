import { validator } from '~/lib/utils/validation';

export const validate = validator<{ issueId: string; content: string }>((input, { error }) => {
	if (typeof input !== 'object' || !input) {
		return error('root', 'object');
	}
	if (!('issueId' in input) || typeof input.issueId !== 'string') {
		return error('issueId', 'string');
	}

	if (!('content' in input) || typeof input.content !== 'string') {
		return error('content', 'string');
	}
	const content = input.content.trim();
	if (content.length === 0) {
		return error('content', 'string');
	}

	input.content = content;
});

export function decode(formData: FormData) {
	return {
		issueId: formData.get('issueId'),
		content: formData.get('content')
	};
}
