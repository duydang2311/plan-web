import { v2 } from 'cloudinary';
import { Context } from 'effect';

export class Cloudinary extends Context.Tag('@app/Cloudinary')<Cloudinary, typeof v2>() {}
