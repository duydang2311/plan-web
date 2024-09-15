import { validator } from '~/lib/utils/validation';

export const validate = validator<{ workspaceId: string; name: string; identifier: string }>(
    (input, { error }) => {
        if (!input || typeof input !== 'object') {
            return error('root', 'object');
        }

        if (
            !('workspaceId' in input) ||
            !input.workspaceId ||
            typeof input.workspaceId !== 'string'
        ) {
            return error('workspaceId', 'string');
        }

        if (!('name' in input) || !input.name || typeof input.name !== 'string') {
            return error('name', 'string');
        }

        if (!('identifier' in input) || !input.identifier || typeof input.identifier !== 'string') {
            return error('identifier', 'string');
        }

        if (input.identifier === 'new') {
            return error('identifier', 'invalid');
        }
    }
);

export function decode(formData: FormData) {
    return {
        workspaceId: formData.get('workspaceId'),
        name: formData.get('name'),
        identifier: formData.get('identifier')
    };
}
