<script lang="ts">
    import { page } from '$app/state';
    import type { Snippet } from 'svelte';
    import { ChatLayout } from '~/lib/components/pages';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { LayoutData } from './$types';

    const { data, children }: { data: LayoutData; children: Snippet } = $props();
    const chatListRef = createRef.maybePromise(() => data.chatList);
</script>

<ChatLayout
    {chatListRef}
    user={data.user}
    buildChatHref={(chat) => `/${page.params.path}/chats/${chat.id}`}
    selectedChatId={page.params.chatId}
>
    {@render children()}
</ChatLayout>
