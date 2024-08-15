import { validator } from '~/lib/utils/validation';

export function decodeInvite(formData: FormData) {
    return { teamId: formData.get('teamId'), query: formData.get('query') };
}

export const validateInvite = validator<{ teamId: string; query: string }>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('root', 'object');
    }

    if (!('teamId' in input) || !input.teamId || typeof input.teamId !== 'string') {
        return error('teamId', 'string');
    }

    if (!('query' in input) || !input.query || typeof input.query !== 'string') {
        return error('query', 'string');
    }

    const query = input.query.trim();
    if (!query.length) {
        return error('query', 'string');
    }
    input.query = query;
});
