export interface User {
    id: string;
    email: string;
    profile?: UserProfile;
}

export interface UserProfile {
    name: string;
    imageUrl?: string;
}
