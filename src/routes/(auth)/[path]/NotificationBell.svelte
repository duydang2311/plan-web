<script lang="ts">
    import { melt } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { IconButton, PopoverBuilder } from '~/lib/components';
    import { IconBellOutline } from '~/lib/components/icons';
    import { popover, tsap } from '~/lib/utils/transition';
    import NotificationPopover from './NotificationPopover.svelte';

    const { userId }: { userId: string } = $props();
    const open = writable(false);
</script>

<PopoverBuilder options={{ open, forceVisible: true }}>
    {#snippet children({ content, trigger })}
        <IconButton
            type="button"
            variant="base"
            melt={trigger}
            data-custom-state={$open ? 'open' : 'closed'}
        >
            <IconBellOutline />
        </IconButton>
        {#if $open}
            <div
                class="w-paragraph-sm translate-y-2 bg-transparent lg:-translate-x-2"
                use:melt={content}
                in:tsap={popover.in}
                out:tsap={popover.out}
            >
                <div class="c-popover p-0">
                    <NotificationPopover {userId} />
                </div>
            </div>
        {/if}
    {/snippet}
</PopoverBuilder>
