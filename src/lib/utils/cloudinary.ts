import type { Cloudinary } from '@cloudinary/url-gen/index';
import type { Asset } from '../models/asset';

export const urlFromAsset = (cloudinary: Cloudinary) => (asset?: Partial<Asset>) => {
    if (!asset || !asset.publicId || !asset.resourceType || asset.version == null) {
        return null;
    }
    return cloudinary
        .image(asset.publicId)
        .format('auto')
        .setVersion(asset.version)
        .setAssetType(asset.resourceType)
        .toURL();
};

export const imageFromAsset = (cloudinary: Cloudinary) => (asset?: Partial<Asset>) => {
    if (!asset || !asset.publicId || !asset.resourceType || asset.version == null) {
        return null;
    }
    return cloudinary
        .image(asset.publicId)
        .format('auto')
        .setVersion(asset.version)
        .setAssetType(asset.resourceType);
};
