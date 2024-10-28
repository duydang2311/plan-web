import { Context, Layer } from 'effect';
import { error } from 'elysia';
import { Cloudinary } from '../services/cloudinary.server';
import { v2 } from 'cloudinary';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

v2.config({
    cloud_name: publicEnv.PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
});

export class ErrorFn extends Context.Tag('@plan/error-fn')<ErrorFn, typeof error>() {}

export const ErrorFnLive = Layer.sync(ErrorFn, () => error);
export const CloudinaryLive = Layer.sync(Cloudinary, () => v2);
