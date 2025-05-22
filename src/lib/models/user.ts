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
    bio?: string;
    socialLinks?: UserSocialLink[];
}

export interface UserSocialLink {
    id: number;
    userId: string;
    url: string;
}

export interface UserPreset {
    id: { id: string };
    basicProfile: {
        id: string;
        email: string;
        profile?: {
            name: string;
            displayName: string;
            image?: Partial<Asset>;
        };
    };
    email: {
        email: string;
    };
    profile: {
        profile?: {
            name: string;
            displayName: string;
            image?: Partial<Asset>;
        };
    };
}

export interface UserProfileSignedUpload {
    timestamp: string;
    transformation: string;
    publicId: string;
    notificationUrl: string;
    url: string;
    apiKey: string;
    signature: string;
}
