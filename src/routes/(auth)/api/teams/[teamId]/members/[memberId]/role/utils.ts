import { validator } from '~/lib/utils/validation';

export function decodeChangeRole(formData: FormData) {
    return {
        roleName: formData.get('roleName')
    };
}

export const validateChangeRole = validator<{ roleName: string }>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('root', 'object');
    }

    if (!('roleName' in input) || !input.roleName || typeof input.roleName !== 'string') {
        return error('roleName', 'invalid');
    }

    if (
        input.roleName !== 'Administrator' &&
        input.roleName !== 'Manager' &&
        input.roleName !== 'Member' &&
        input.roleName !== 'Guest'
    ) {
        return error('roleName', 'invalid');
    }
});
