import { v2 } from 'cloudinary';
import { Context, Layer } from 'effect';

export class Cloudinary extends Context.Tag('@app/Cloudinary')<Cloudinary, typeof v2>() {
    public static readonly Live = Layer.sync(Cloudinary, () => v2);
}
