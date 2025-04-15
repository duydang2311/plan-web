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
            computePosition: {
                placement: 'bottom',
                middleware: [
                    offset({
                        mainAxis: 8
                    }),
                    {
                        name: 'window-rightmost',
                        fn: (state) => {
                            return {
                                x:
                                    window.innerWidth >= 1024
                                        ? window.innerWidth -
                                          state.elements.floating.clientWidth -
                                          16
                                        : window.innerWidth -
                                          state.elements.floating.clientWidth -
                                          8,
                                y: state.y
                            };
                        }
                    }
                ]
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
        class="c-popover w-paragraph-sm overflow-visible p-0"
        style="top: {pos?.y ?? 0}px; left: {pos?.x ?? 0}px;"
    >
        <FriendPopover {userId} />
    </div>
{/if}
