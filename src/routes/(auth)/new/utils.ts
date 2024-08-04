import { validator } from '~/lib/utils/validation';

const keywords = ['new', 'login', 'app'];

export const validate = validator<{ name: string; path: string }>((input, { error }) => {
    if (typeof input !== 'object' || input == null) return error('root', 'object');
    if (!('name' in input) || typeof input.name !== 'string') return error('name', 'string');
    if (input.name.trim().length === 0) return error('name', 'empty');

    const match = input.name.match(/[^a-zA-Z0-9\-_\s]/);
    if (match && match.length > 0) return error('name', 'pattern');
    if (!('path' in input) || typeof input.path !== 'string') return error('path', 'string');
    if (input.path.trim().length === 0) return error('path', 'empty');
    if (keywords.includes(input.path.toLowerCase())) return error('path', 'keywords');
});

export function decode(formData: FormData) {
    return {
        name: formData.get<string>('name'),
        path: formData.get<string>('path')
    };
}
