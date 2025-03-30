import type { Asset } from './asset';

export interface User {
    createdTime: string;
    id: string;
    email: string;
    profile?: UserProfile;
}

export interface UserProfile {
    name: string;
    displayName: string;
    image: Partial<Asset>;
}

export interface UserPreset {
    basicProfile: {
        id: string;
        email: string;
        profile?: {
            name: string;
            displayName: string;
            image?: Partial<Asset>;
        };
    };
}
