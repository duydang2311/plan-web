import type { Asset } from './asset';

export interface User {
    id: string;
    email: string;
    profile?: UserProfile;
}

export interface UserProfile {
    name: string;
    displayName: string;
    image: Partial<Asset>;
}
