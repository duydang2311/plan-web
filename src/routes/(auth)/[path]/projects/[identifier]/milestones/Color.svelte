<script lang="ts">
    import { Button } from '~/lib/components';
    import Popover from '~/lib/components/popover';
    import { milestoneColors } from '~/lib/features/milestones/utils';

    const {
        id,
        color,
        onChange
    }: { id: string; color: string; onChange: (id: string, color: string) => void } = $props();
    const popover = new Popover.Builder({
        forceVisible: true,
        sameWidth: false
    });
</script>

<Button
    {...popover.trigger}
    type="button"
    variant="base"
    class="aspect-square"
    style="--_border: {color}; --_bg: {color}; --_bg-active: color-mix(in oklch, {color} 60%, transparent); --_bg-hover: color-mix(in oklch, {color} 80%, transparent);"
></Button>
{#if popover.open}
    <Popover {...popover.content}>
        <ul class="max-w-48 grid grid-cols-[repeat(auto-fit,minmax(2rem,1fr))] gap-1">
            {#each milestoneColors as color (color)}
                <li class="flex aspect-square p-0">
                    <button
                        aria-label={color}
                        type="button"
                        class="focus-visible:ring-offset-base-1 size-full rounded-md transition hover:opacity-80 focus-visible:outline-none focus-visible:ring focus-visible:ring-current focus-visible:ring-offset-1"
                        style="color: {color}; background-color: {color};"
                        onclick={() => {
                            onChange(id, color);
                        }}
                    ></button>
                </li>
            {/each}
        </ul>
    </Popover>
{/if}
