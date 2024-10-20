import { pipe } from '@baetheus/fun/fn';
import { AssetType } from '~/lib/models/asset';
import { TE } from '~/lib/utils/functional';
import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';

export const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.src = url;
    });

export const getCroppedImage = (
    url: string,
    cropArea: { [k in 'x' | 'y' | 'width' | 'height']: number }
) =>
    pipe(
        TE.fromPromise(() => createImage(url))(),
        TE.flatMap((a) => {
            const canvas = new OffscreenCanvas(cropArea.width, cropArea.height);
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                return TE.leftVoid;
            }

            ctx.drawImage(
                a,
                cropArea.x,
                cropArea.y,
                cropArea.width,
                cropArea.height,
                0,
                0,
                cropArea.width,
                cropArea.height
            );
            return TE.right(canvas);
        }),
        TE.map(resize),
        TE.flatMap((a) => TE.fromPromise(() => a.convertToBlob({ quality: 1 }))())
    );

export const decodeCreateProfile = (formData: FormData) => {
    let obj: Record<string, unknown> = {
        userId: formData.get('userId'),
        name: formData.get('name'),
        displayName: formData.get('displayName')
    };

    const bio = formData.get('bio');
    if (bio) {
        obj = { ...obj, bio };
    }

    if (formData.has('image.publicId')) {
        obj = {
            ...obj,
            image: {
                publicId: formData.get('image.publicId'),
                resourceType: formData.get('image.resourceType'),
                format: formData.get('image.format'),
                version: formData.get('image.version')
            }
        };
    }

    const socialLinks = formData.getAll('socialLinks').filter((a) => a);
    if (socialLinks) {
        obj = { ...obj, socialLinks };
    }
    return obj;
};

export const validateCreateProfile = validator(
    Type.Object({
        userId: Type.String(),
        name: Type.RegExp('^[a-zA-Z0-9]+$'),
        displayName: Type.RegExp('^[a-zA-Z\\s]+$'),
        image: Type.Optional(Type.Union([AssetType, Type.Null()])),
        bio: Type.Optional(Type.String()),
        socialLinks: Type.Optional(Type.Array(Type.String({ format: 'url' })))
    }),
    { stripLeadingSlash: true }
);

const resize = (c: OffscreenCanvas) => {
    const canvas = new OffscreenCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return c;
    }

    ctx.drawImage(c, 0, 0, 256, 256);
    return canvas;
};
