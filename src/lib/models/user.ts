import type { Asset } from './asset';

export interface User {
    id: string;
    email: string;
    profile?: UserProfile;
}

export interface UserProfile {
    name: string;
    image: Partial<Asset>;
}
