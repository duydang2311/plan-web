import { Effect } from 'effect';
import type { LocalChat } from '~/lib/components/pages/chat/types';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { user, runtime }, isDataRequest }) => {
    const getChatList = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get('chats', {
                query: {
                    userId: user.id,
                    select: 'CreatedTime,Id,Type,Title,Members.Id,Members.Email,Members.Profile.Name,Members.Profile.DisplayName,Members.Profile.Image',
                    order: '-CreatedTime',
                }
            })
        );
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalChat>>());
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalChat>()),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        chatList: getChatList()
    };
};
