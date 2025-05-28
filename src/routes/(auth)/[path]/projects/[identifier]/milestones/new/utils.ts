import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const decodeCreateMilestone = (formData: FormData) => {
    return {
        projectId: formData.get('projectId'),
        statusId: formData.get('statusId'),
        title: formData.get('title')?.toString().trim(),
        description: formData.get('description')?.toString().trim(),
        emoji: formData.get('emoji'),
        color: formData.get('color')
    };
};

export const validateCreateMilestone = validator(
    Type.Object({
        projectId: Type.String(),
        statusId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        title: Type.String(),
        description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        emoji: Type.String(),
        color: Type.String()
    }),
    { stripLeadingSlash: true }
);
