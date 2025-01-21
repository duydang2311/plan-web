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
