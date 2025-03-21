<script lang="ts">
    import { writable } from 'svelte/store';
    import { IconButton, PopoverBuilder } from '~/lib/components';
    import { IconUsersSolid } from '~/lib/components/icons';
    import { popover as popoverTransitions, tsap } from '~/lib/utils/transition';
    import FriendPopover from './FriendPopover.svelte';
    import { melt } from '@melt-ui/svelte';

    const { userId }: { userId: string } = $props();
    const open = writable(false);
</script>

<PopoverBuilder options={{ open, forceVisible: true }}>
    {#snippet children({ trigger, content })}
        <IconButton variant="base" type="button" melt={trigger} title="Friends">
            <IconUsersSolid />
        </IconButton>
        {#if $open}
            <div
                in:tsap={popoverTransitions.in}
                out:tsap={popoverTransitions.out}
                use:melt={content}
                class="c-popover w-paragraph-sm -translate-x-2 translate-y-2 p-0 lg:-translate-x-4"
            >
                <FriendPopover {userId} />
            </div>
        {/if}
    {/snippet}
</PopoverBuilder>
