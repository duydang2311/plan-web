import { LoadResponse } from '~/lib/utils/kit';
import type { PageServerLoad } from './$types';
import { ApiClient } from '~/lib/services/api_client.server';
import { Effect } from 'effect';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { LocalChatMessage } from '~/lib/components/pages/chat/ChatInbox.svelte';
import { maybeStream } from '~/lib/utils/promise';

export const load: PageServerLoad = async ({ params, locals: { runtime }, isDataRequest }) => {
    const chatId = params.chatId;
    const getMessageList = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`chats/${chatId}/messages`, {
                query: {
                    select: 'Id,CreatedTime,Content,Sender.Id,Sender.Email,Sender.Profile.Name,Sender.Profile.DisplayName,Sender.Profile.Image',
                    order: '-Id,-CreatedTime'
                }
            })
        );

        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalChatMessage>>());
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalChatMessage>()),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        messageList: getMessageList()
    };
};
