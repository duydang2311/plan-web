import { Type } from '../utils/typebox';

export interface Asset {
    resourceType: string;
    publicId: string;
    format: string;
    version: number;
}

export const AssetType = Type.Object({
    publicId: Type.String(),
    resourceType: Type.String(),
    format: Type.String(),
    version: Type.String()
});
