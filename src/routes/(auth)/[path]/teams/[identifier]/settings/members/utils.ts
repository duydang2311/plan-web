import { validator } from '~/lib/utils/validation';

export function decodeInvite(formData: FormData) {
    return { teamId: formData.get('teamId'), memberId: formData.get('memberId') };
}

export const validateInvite = validator<{ teamId: string; memberId: string }>(
    (input, { error }) => {
        if (!input || typeof input !== 'object') {
            return error('root', 'object');
        }

        if (!('teamId' in input) || !input.teamId || typeof input.teamId !== 'string') {
            return error('teamId', 'string');
        }

        if (!('memberId' in input) || !input.memberId || typeof input.memberId !== 'string') {
            return error('memberId', 'string');
        }
    }
);
