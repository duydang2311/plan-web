<script lang="ts">
    import { IconButton, MeltPopoverBuilder } from '~/lib/components';
    import { IconUsersSolid } from '~/lib/components/icons';
    import FriendList from './FriendList.svelte';
    import { tsap, popover as popoverTransitions } from '~/lib/utils/transition';

    const { userId }: { userId: string } = $props();
</script>

<MeltPopoverBuilder forceVisible>
    {#snippet children(popover)}
        <IconButton
            variant="base"
            type="button"
            {...popover.trigger}
            data-melt-next-popover-trigger
            data-state={popover.open ? 'open' : undefined}
            title="Friends"
        >
            <IconUsersSolid />
        </IconButton>
        {#if popover.open}
            <div
                in:tsap={popoverTransitions.in}
                out:tsap={popoverTransitions.out}
                class="c-popover -translate-x-2 translate-y-2 lg:-translate-x-4 w-paragraph-sm"
                {...popover.content}
            >
                <FriendList {userId} />
            </div>
        {/if}
    {/snippet}
</MeltPopoverBuilder>
