import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { v2 } from 'cloudinary';
import { Context, Layer } from 'effect';

export class Cloudinary extends Context.Tag('@app/Cloudinary')<Cloudinary, typeof v2>() {
    public static readonly Live = Layer.sync(Cloudinary, () => {
        v2.config({
            cloud_name: publicEnv.PUBLIC_CLOUDINARY_CLOUD_NAME,
            api_key: privateEnv.CLOUDINARY_API_KEY,
            api_secret: privateEnv.CLOUDINARY_API_SECRET,
            secure: true
        });
        return v2;
    });
}
