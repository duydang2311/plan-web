import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const validate = validator(
    Type.Object({
        teamId: Type.String(),
        title: Type.String(),
        description: Type.Optional(Type.String())
    }),
    { stripLeadingSlash: true }
);

export const decode = (formData: FormData) =>
    ({
        teamId: formData.get('teamId') ?? '',
        title: formData.get('title') ?? '',
        description: formData.get('description')
    }) as const;
