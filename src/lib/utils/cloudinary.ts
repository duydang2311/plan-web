import { Effect } from 'effect';
import type { Asset } from '../models/asset';
import { Cloudinary } from '../services/cloudinary.server';
import { InvalidAssetError } from '../models/errors';

export const urlFromAsset = (
    asset: Partial<Asset>
): Effect.Effect<string, InvalidAssetError, Cloudinary> =>
    asset.format && asset.publicId && asset.resourceType && asset.version
        ? Cloudinary.pipe(
              Effect.map((a) =>
                  a.url(asset.publicId!, {
                      format: asset.format,
                      resource_type: asset.resourceType,
                      version: asset.version,
                      fetch_format: 'auto',
                      quality: 'auto'
                  })
              )
          )
        : Effect.fail(InvalidAssetError.instance);
