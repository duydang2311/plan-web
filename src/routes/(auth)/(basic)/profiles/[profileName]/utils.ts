import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const decodeCreateProfile = (formData: FormData) => {
    const obj: Record<string, unknown> = {
        userId: formData.get('userId'),
        name: formData.get('name'),
        displayName: formData.get('displayName')
    };

    const bio = formData.get('bio');
    if (bio) {
        obj['bio'] = bio;
    }

    if (
        formData.has('image.publicId') &&
        formData.has('image.resourceType') &&
        formData.has('image.format') &&
        formData.has('image.version')
    ) {
        obj['image'] = {
            publicId: formData.get('image.publicId'),
            resourceType: formData.get('image.resourceType'),
            format: formData.get('image.format'),
            version: formData.get('image.version')
        };
    }

    const socialLinks = formData.getAll('socialLinks').filter((a) => a);
    if (socialLinks.length) {
        obj['socialLinks'] = socialLinks;
    }
    return obj;
};

export const validateCreateProfile = validator(
    Type.Object({
        userId: Type.String(),
        name: Type.RegExp('^[a-zA-Z0-9]+$'),
        displayName: Type.RegExp('^[a-zA-Z\\s]+$'),
        image: Type.Optional(
            Type.Union([
                Type.Object({
                    publicId: Type.String(),
                    resourceType: Type.String(),
                    format: Type.String(),
                    version: Type.Number()
                }),
                Type.Null()
            ])
        ),
        bio: Type.Optional(Type.String()),
        socialLinks: Type.Optional(Type.Array(Type.String({ format: 'url' })))
    }),
    { convert: true, stripLeadingSlash: true }
);
