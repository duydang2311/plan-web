import type { Context } from 'effect';
import type { ChatMessage } from '~/lib/models/chat';
import type { UserPreset } from '~/lib/models/user';
import type { HttpClient } from '~/lib/services/http_client';
import { attempt, tryPromise, type Attempt } from '~/lib/utils/try';

export type LocalChatMessage = Pick<ChatMessage, 'id' | 'createdTime' | 'content'> & {
    sender: UserPreset['basicProfile'];
};

export const getChatMessage =
    (http: Context.Tag.Service<HttpClient>) =>
    async (chatMessageId: number): Promise<Attempt<LocalChatMessage, unknown>> => {
        const tryGet = await attempt.promise(() =>
            http.get(`chat-messages/${chatMessageId}`, {
                query: {
                    select: 'Id,CreatedTime,Content,Sender.Id,Sender.Email,Sender.Profile.Name,Sender.Profile.DisplayName,Sender.Profile.Image'
                }
            })
        )();

        if (!tryGet.ok || !tryGet.data.ok) {
            return attempt.fail('http');
        }

        const tryJson = await tryPromise(() => tryGet.data.json<LocalChatMessage>())();
        if (!tryJson.ok) {
            return attempt.fail('json');
        }

        return {
            ok: true,
            data: tryJson.data
        };
    };

export const infinitizeChatMessageData = (arr: LocalChatMessage[], totalCount: number) => {
    const size = 20;
    const partitions = Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
        arr.slice(i * size, i * size + size)
    );
    return {
        pages: partitions.map((b) => ({
            items: b,
            totalCount
        })),
        pageParams: partitions.map((_, i) => (i === 0 ? undefined : partitions[i - 1].at(-1)?.id))
    };
};
