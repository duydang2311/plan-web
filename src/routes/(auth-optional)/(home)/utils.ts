import { validator } from '~/lib/utils/validation';

export const validateAcceptTeamInvite = validator<{ teamInvitationId: string }>(
    (input, { error }) => {
        if (!input || typeof input !== 'object') {
            return error('root', 'object');
        }

        if (
            !('teamInvitationId' in input) ||
            !input.teamInvitationId ||
            typeof input.teamInvitationId !== 'string'
        ) {
            return error('teamInvitationId', 'string');
        }
    }
);

export function decodeAcceptTeamInvite(formData: FormData) {
    return {
        teamInvitationId: formData.get('teamInvitationId')
    };
}

export const validateDeclineTeamInvite = validator<{ teamInvitationId: string }>(
    (input, { error }) => {
        if (!input || typeof input !== 'object') {
            return error('root', 'object');
        }

        if (
            !('teamInvitationId' in input) ||
            !input.teamInvitationId ||
            typeof input.teamInvitationId !== 'string'
        ) {
            return error('teamInvitationId', 'string');
        }
    }
);

export function decodeDeclineTeamInvite(formData: FormData) {
    return {
        teamInvitationId: formData.get('teamInvitationId')
    };
}

export const createWorkspaceListParams = (userId: string) =>
    ({
        userId,
        select: 'Name,Path'
    }) as const;
