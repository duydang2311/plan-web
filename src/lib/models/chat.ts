import type { User } from './user';

export interface Chat {
    createdTime: string;
    updatedTime: string;
    id: string;
    type: ChatType;
    title?: string;
    lastChatMessage?: ChatMessage;
    chatMembers?: ChatMember[];
    members?: User[];
}

export interface ChatMessage {
    createdTime: string;
    id: number;
    chatId: string;
    chat: Chat;
    senderId: string;
    sender: User;
    content: string;
}

export interface ChatMember {
    createdTime: string;
    chatId: string;
    chat: Chat;
    memberId: string;
    member: User;
    lastReadMessageId?: number;
    lastReadMessage?: ChatMessage;
}

export const ChatTypes = {
    None: 0,
    OneOnOne: 1,
    Group: 2,
    Broadcast: 3
} as const;

export type ChatType = (typeof ChatTypes)[keyof typeof ChatTypes];
