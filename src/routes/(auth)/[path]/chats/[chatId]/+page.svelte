<script lang="ts">
    import { page } from '$app/state';
    import ChatInbox from '~/lib/components/pages/chat/ChatInbox.svelte';
    import type { PageData } from './$types';

    const { data }: { data: PageData } = $props();
</script>

<ChatInbox chatId={page.params.chatId} user={data.user} />
