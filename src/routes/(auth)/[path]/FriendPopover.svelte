<script lang="ts">
    import { Button } from '~/lib/components';
    import FriendList from './FriendList.svelte';
    import FriendRequestList from './FriendRequestList.svelte';

    const { userId }: { userId: string } = $props();
    let activeView = $state.raw<'all' | 'requests'>('all');
</script>

<div class="min-h-96">
    <div class="border-b-base-border-2 border-b p-2">
        <ul class="flex gap-2">
            <li>
                <Button
                    variant="base"
                    size="sm"
                    data-friend-active={activeView === 'all' ? true : undefined}
                    onclick={() => {
                        activeView = 'all';
                    }}
                    class="data-[friend-active]:not-[:hover,:active]:bg-base-4 data-[friend-active]:not-[:hover,:active]:text-base-fg-1 capitalize"
                >
                    All friends
                </Button>
            </li>
            <li>
                <Button
                    variant="base"
                    size="sm"
                    data-friend-active={activeView === 'requests' ? true : undefined}
                    class="data-[friend-active]:not-[:hover,:active]:bg-base-4 data-[friend-active]:not-[:hover,:active]:text-base-fg-1 capitalize"
                    onclick={() => {
                        activeView = 'requests';
                    }}
                >
                    Friend requests
                </Button>
            </li>
        </ul>
    </div>
    {#if activeView === 'all'}
        <FriendList {userId} />
    {:else if activeView === 'requests'}
        <FriendRequestList {userId} />
    {/if}
</div>
