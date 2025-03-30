import { mapMaybePromise } from '~/lib/utils/promise';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, data, parent }) => {
    const { queryClient } = await parent();

    await queryClient.prefetchInfiniteQuery({
        queryKey: ['chat-messages', { chatId: params.chatId }],
        queryFn: async () =>
            await mapMaybePromise(data.messageList)((a) => ({
                ...a,
                nextCursor: a.items.length < 20 ? undefined : a.items.at(-1)?.id
            })),
        initialPageParam: undefined
    });

    return data;
};
