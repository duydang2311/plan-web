<script lang="ts">
    import { melt } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { IconButton, PopoverBuilder } from '~/lib/components';
    import { IconBellOutline } from '~/lib/components/icons';
    import { popover, tsap } from '~/lib/utils/transition';
    import NotificationPopover from './NotificationPopover.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';

    const { userId }: { userId: string } = $props();
    const open = writable(false);
    const { hub } = useRuntime();

    let unreadCount = $state.raw(0);

    hub.on('new_notification', (data: any) => {
        console.log('new_notification', data);
        ++unreadCount;
    });
</script>

<PopoverBuilder options={{ open, forceVisible: true }}>
    {#snippet children({ content, trigger })}
        <IconButton
            type="button"
            variant={unreadCount === 0 ? 'base' : 'info'}
            melt={trigger}
            data-custom-state={$open ? 'open' : 'closed'}
            class="relative"
        >
            <IconBellOutline />
            {#if unreadCount > 0}
                <div
                    class="bg-info-1/10 text-info-1 pointer-events-none absolute left-0 top-1/2 h-auto w-4 min-w-max -translate-x-full -translate-y-1/2 content-center rounded-full px-1 py-1 text-xs font-bold leading-none"
                >
                    +{unreadCount}
                </div>
            {/if}
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
