import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const validate = validator(
    Type.Object({
        workspaceId: Type.String(),
        name: Type.String(),
        identifier: Type.String({ maxLength: 5 })
    }),
    { stripLeadingSlash: true }
);

Type.String({});

export function decode(formData: FormData) {
    return {
        workspaceId: formData.get('workspaceId'),
        name: formData.get('name'),
        identifier: formData.get('identifier')
    };
}
