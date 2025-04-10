<script lang="ts">
    import { page } from '$app/state';
    import ChatInbox from '~/lib/components/pages/chat/ChatInbox.svelte';
    import type { PageData } from './$types';
    import { onMount } from 'svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';

    const { data }: { data: PageData } = $props();
    const { chatHub } = useRuntime();

    onMount(() => {
        (async () => {
            console.log('connect to chatHub');
            await chatHub.connection.start().catch(console.log);
        })();
        return () => {
            chatHub.connection.stop().catch(console.log);
        };
    });
</script>

<ChatInbox chatId={page.params.chatId} user={data.user} />
