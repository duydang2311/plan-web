import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const decodeInviteMember = (formData: FormData) => ({
    workspaceId: formData.get('workspaceId'),
    userId: formData.get('userId')
});

export const validateInviteMember = validator(
    Type.Object({
        workspaceId: Type.String(),
        userId: Type.String()
    })
);
