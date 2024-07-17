import { validator } from '~/lib/utils/validation';

export const validate = validator<{
	teamId: string;
	title: string;
	description?: string;
}>((input, { error }) => {
	if (typeof input !== 'object' || !input) {
		return error('root', 'object');
	}
	if (!('teamId' in input) || typeof input.teamId !== 'string') {
		return error('title', 'string');
	}
	if (!('title' in input) || typeof input.title !== 'string') {
		return error('title', 'string');
	}

	const qualifiedTitle = input.title.trim();
	if (!qualifiedTitle.length) {
		return error('title', 'string');
	}

	if ('description' in input) {
		if (typeof input.description !== 'string') {
			return error('description', 'string');
		} else {
			const qualifiedDescription = input.description.trim();
			if (!qualifiedDescription.length) {
				return error('description', 'string');
			}
			input.description = qualifiedDescription;
		}
	}

	input.title = qualifiedTitle;
});

export const decode = (formData: FormData) =>
	({
		teamId: formData.get('teamId') ?? '',
		title: formData.get('title') ?? '',
		description: formData.get('description')
	}) as const;
