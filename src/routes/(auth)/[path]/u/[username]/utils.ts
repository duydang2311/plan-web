import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const decodeAddSocialLink = (formData: FormData) => {
    return {
        userId: formData.get('userId'),
        url: formData.get('url')
    };
};

export const validateAddSocialLink = validator(
    Type.Object({
        userId: Type.String(),
        url: Type.String({ format: 'url' })
    })
);
