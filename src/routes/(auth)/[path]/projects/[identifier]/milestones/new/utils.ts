import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const decodeCreateMilestone = (formData: FormData) => {
    return {
        projectId: formData.get('projectId'),
        title: formData.get('title')?.toString().trim(),
        endTime: formData.get('endTime')?.toString().trim(),
        endTimeZone: formData.get('endTimeZone')?.toString().trim(),
        statusId: formData.get('statusId') || null,
        description: formData.get('description')?.toString().trim(),
        emoji: formData.get('emoji'),
        color: formData.get('color')
    };
};

export const validateCreateMilestone = validator(
    Type.Object({
        projectId: Type.String(),
        statusId: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        endTime: Type.String(),
        endTimeZone: Type.String(),
        title: Type.String(),
        description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
        emoji: Type.String(),
        color: Type.String()
    }),
    { stripLeadingSlash: true }
);
