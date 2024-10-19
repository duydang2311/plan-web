import { pipe } from '@baetheus/fun/fn';
import type { Asset } from '~/lib/models/asset';
import { TE } from '~/lib/utils/functional';
import { validator } from '~/lib/utils/validation';

const invalidNameRegex = /[^a-zA-Z0-9]/;
const invalidDisplayNameRegex = /[^a-zA-Z\s]/;

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
    return {
        userId: formData.get('userId'),
        name: formData.get('name'),
        displayName: formData.get('displayName'),
        bio: formData.get('bio'),
        image: formData.has('image.publicId')
            ? {
                  publicId: formData.get('image.publicId'),
                  resourceType: formData.get('image.resourceType'),
                  format: formData.get('image.format'),
                  version: formData.get('image.version')
              }
            : null,
        socialLinks: formData.getAll('socialLink')
    };
};

export const validateCreateProfile = validator<{
    userId: string;
    name: string;
    displayName: string;
    image?: Asset;
    bio?: string;
    socialLinks?: string[];
}>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('$', 'object');
    }

    if (!('userId' in input) || !input.userId || typeof input.userId !== 'string') {
        return error('userId', 'string');
    }

    if (!('name' in input) || !input.name || typeof input.name !== 'string') {
        return error('name', 'string');
    }

    if (invalidNameRegex.test(input.name)) {
        return error('name', 'invalid');
    }

    if (!('displayName' in input) || !input.displayName || typeof input.displayName !== 'string') {
        return error('displayName', 'string');
    }

    if (invalidDisplayNameRegex.test(input.displayName)) {
        return error('displayName', 'invalid');
    }

    if ('bio' in input && input.bio && typeof input.bio !== 'string') {
        return error('bio', 'string');
    }

    if ('image' in input && input.image) {
        const validation = validateImageAsset(input.image);
        if (!validation.ok) {
            return error(validation.errors);
        }
    }

    if ('socialLinks' in input && input.socialLinks) {
        if (!Array.isArray(input.socialLinks)) {
            return error('socialLinks', 'array');
        }
        if (input.socialLinks.some((a) => typeof a !== 'string')) {
            return error('socialLinks.[]', 'string');
        }
    }
});

const validateImageAsset = validator<Asset>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('image', 'object');
    }

    if (!('publicId' in input) || !input.publicId || typeof input.publicId !== 'string') {
        return error('image.publicId', 'string');
    }

    if (
        !('resourceType' in input) ||
        !input.resourceType ||
        typeof input.resourceType !== 'string'
    ) {
        return error('image.resourceType', 'string');
    }

    if (!('format' in input) || !input.format || typeof input.format !== 'string') {
        return error('image.format', 'string');
    }

    if (!('version' in input) || !input.version) {
        return error('image.version', 'number');
    } else {
        if (typeof input.version !== 'string') {
            return error('image.version', 'number');
        }
        const v = Number(input.version);
        if (isNaN(v)) {
            return error('image.version', 'number');
        }
        input.version = v;
    }
});

const resize = (c: OffscreenCanvas) => {
    const canvas = new OffscreenCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return c;
    }
    ctx.drawImage(c, 0, 0, 256, 256);
    return canvas;
};

const a = () => pipe({}, validateImageAsset);
