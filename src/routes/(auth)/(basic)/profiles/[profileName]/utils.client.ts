import { pipe } from '@baetheus/fun/fn';
import { TE } from '~/lib/utils/functional';

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

const resize = (c: OffscreenCanvas) => {
    const canvas = new OffscreenCanvas(256, 256);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        return c;
    }

    ctx.drawImage(c, 0, 0, 256, 256);
    return canvas;
};
