import { validator } from '~/lib/utils/validation';

export const validate = validator<{ workspaceId: string; name: string; identifier: string }>(
    (input, { error }) => {
        if (typeof input !== 'object' || input == null) return error('root', 'object');
        if (!('workspaceId' in input) || typeof input.workspaceId !== 'string')
            return error('workspaceId', 'required');
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
    }
);

export const decode = (formData: FormData) => {
    return {
        workspaceId: formData.get<string>('workspaceId') ?? '',
        name: formData.get<string>('name') ?? '',
        identifier: formData.get<string>('identifier') ?? ''
    };
};
