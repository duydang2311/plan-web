import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const decodeUpdateTitle = (data: FormData) => {
    const title = data.get('title');
    return {
        id: data.get('id'),
        title: typeof title === 'string' ? title.trim() : undefined
    };
};

export const validateUpdateTitle = validator(
    Type.Object({
        id: Type.String(),
        title: Type.String({ minLength: 1, maxLength: 128 })
    }),
    {
        stripLeadingSlash: true
    }
);

export const decodeUpdateDescription = (data: FormData) => {
    let description = data.get('description');
    if (typeof description === 'string') {
        description = description.trim();
        if (description.length > 0) {
            return {
                id: data.get('id'),
                description
            };
        }
    }
    return {
        id: data.get('id')
    };
};

export const validateUpdateDescription = validator(
    Type.Object({
        id: Type.String(),
        description: Type.Optional(Type.Union([Type.String({ minLength: 1 }), Type.Null()]))
    }),
    {
        stripLeadingSlash: true
    }
);
