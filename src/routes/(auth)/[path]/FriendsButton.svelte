<script lang="ts">
    import { Popover } from 'melt/builders';
    import { IconButton } from '~/lib/components';
    import { IconUsersSolid } from '~/lib/components/icons';
    import { popover as popoverTransitions, tsap } from '~/lib/utils/transition';
    import FriendPopover from './FriendPopover.svelte';
    import { offset } from '@floating-ui/dom';

    const { userId }: { userId: string } = $props();
    let open = $state.raw(false);
    let pos = $state.raw<{ x: number; y: number }>();
    const builder = new Popover({
        open: () => open,
        onOpenChange(value) {
            open = value;
        },
        forceVisible: true,
        floatingConfig: {
            offset: {
                mainAxis: 16
            },
            shift: {
                padding: {
                    right: 16
                }
            }
        }
    });
</script>

<IconButton
    variant="base"
    type="button"
    {...builder.trigger}
    title="Friends"
    data-custom-state={open ? 'open' : undefined}
>
    <IconUsersSolid />
</IconButton>
{#if open}
    <div
        in:tsap={popoverTransitions.in}
        out:tsap={popoverTransitions.out}
        {...builder.content}
        class="c-popover--wrapper w-paragraph-sm p-0"
        style="top: {pos?.y ?? 0}px; left: {pos?.x ?? 0}px;"
    >
        <FriendPopover {userId} />
    </div>
{/if}
