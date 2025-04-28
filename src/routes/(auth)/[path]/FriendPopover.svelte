<script lang="ts">
    import { Button, IconButton } from '~/lib/components';
    import { IconUserPlus } from '~/lib/components/icons';
    import AddFriendView from './AddFriendView.svelte';
    import FriendList from './FriendList.svelte';
    import FriendRequestList from './FriendRequestList.svelte';

    const { userId }: { userId: string } = $props();
    let activeView = $state.raw<'all' | 'requests' | 'add-friend'>('all');
</script>

<div class="min-h-96 c-popover p-0">
    <div class="border-b-base-border-2 flex items-center justify-between gap-4 border-b p-2">
        <ul class="flex gap-2">
            <li>
                <Button
                    variant="base"
                    size="sm"
                    data-friend-active={activeView === 'all' ? true : undefined}
                    onclick={() => {
                        activeView = 'all';
                    }}
                    class="data-[friend-active]:not-[:hover,:active]:bg-base-selected data-[friend-active]:not-[:hover,:active]:text-base-fg-1 capitalize"
                >
                    All friends
                </Button>
            </li>
            <li>
                <Button
                    variant="base"
                    size="sm"
                    data-friend-active={activeView === 'requests' ? true : undefined}
                    class="data-[friend-active]:not-[:hover,:active]:bg-base-selected data-[friend-active]:not-[:hover,:active]:text-base-fg-1 capitalize"
                    onclick={() => {
                        activeView = 'requests';
                    }}
                >
                    Friend requests
                </Button>
            </li>
        </ul>
        <IconButton
            variant="base"
            title="Add friend"
            data-friend-active={activeView === 'add-friend' ? true : undefined}
            class="data-[friend-active]:not-[:hover,:active]:bg-base-selected data-[friend-active]:not-[:hover,:active]:text-base-fg-1"
            onclick={() => {
                activeView = 'add-friend';
            }}
        >
            <IconUserPlus />
        </IconButton>
    </div>
    {#if activeView === 'all'}
        <FriendList {userId} />
    {:else if activeView === 'requests'}
        <FriendRequestList {userId} />
    {:else if activeView === 'add-friend'}
        <AddFriendView {userId} />
    {/if}
</div>
