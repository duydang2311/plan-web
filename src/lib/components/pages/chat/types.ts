import type { Chat } from '~/lib/models/chat';
import type { User, UserProfile } from '~/lib/models/user';

export type LocalChat = Pick<Chat, 'createdTime' | 'id' | 'type' | 'title'> & {
    chatMembers: {
        member: Pick<User, 'id' | 'email'> & {
            profile?: Pick<UserProfile, 'name' | 'displayName' | 'image'>;
        };
        lastReadMessageId?: number;
    }[];
};
