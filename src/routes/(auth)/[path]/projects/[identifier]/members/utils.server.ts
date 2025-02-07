import { validator } from '~/lib/utils/validation';
import { Type } from '~/lib/utils/typebox';

export const decodeDeleteMember = (formData: FormData) => {
    return {
        id: formData.get('id')
    };
};

export const validateDeleteMember = validator(
    Type.Object({
        id: Type.Number()
    }),
    { convert: true }
);

export const decodeInviteMember = (formData: FormData) => {
    return {
        projectId: formData.get('projectId'),
        userId: formData.get('userId')
    };
};

export const validateInviteMember = validator(
    Type.Object({
        projectId: Type.String(),
        userId: Type.String()
    }),
    { stripLeadingSlash: true }
);

export const decodeDeleteInvitation = (formData: FormData) => {
    return {
        id: formData.get('id')
    };
};

export const validateDeleteInvitation = validator(
    Type.Object({
        id: Type.Number()
    }),
    { stripLeadingSlash: true, convert: true }
);
