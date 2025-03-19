<script lang="ts">
    import { size } from '@floating-ui/dom';
    import { IconButton, MeltPopoverBuilder } from '~/lib/components';
    import { IconUsersSolid } from '~/lib/components/icons';
    import { popover as popoverTransitions, tsap } from '~/lib/utils/transition';
    import FriendPopover from './FriendPopover.svelte';

    const { userId }: { userId: string } = $props();
    let open = $state.raw(true);
</script>

<MeltPopoverBuilder
    computePositionOptions={{
        middleware: [
            size({
                apply: ({ availableWidth, availableHeight, elements }) => {
                    Object.assign(elements.floating.style, {
                        maxWidth: `${Math.max(0, availableWidth - 16)}px`,
                        maxHeight: `${Math.max(0, availableHeight - 16)}px`
                    });
                }
            })
        ]
    }}
>
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
        {#if open}
            <div
                in:tsap={popoverTransitions.in}
                out:tsap={popoverTransitions.out}
                class="c-popover w-paragraph-sm -translate-x-2 translate-y-2 p-0 lg:-translate-x-4"
                {...popover.content}
            >
                <FriendPopover {userId} />
            </div>
        {/if}
    {/snippet}
</MeltPopoverBuilder>
