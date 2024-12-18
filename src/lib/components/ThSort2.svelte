<script lang="ts">
    import clsx from 'clsx';
    import type { Snippet } from 'svelte';
    import { sineInOut } from 'svelte/easing';
    import type { HTMLThAttributes } from 'svelte/elements';
    import { scale } from 'svelte/transition';
    import { Button, Icon } from '.';
    import type { SortField } from '../utils/table.svelte';

    interface Props {
        field: SortField;
        children: Snippet;
        html?: HTMLThAttributes;
    }
    const { field, children, html }: Props = $props();
    const { class: cls, ...restProps } = $derived(html ?? {});
</script>

<th {...restProps} class="c-table--th c-table--th-sort {cls}">
    <Button
        type="button"
        variant="base"
        size="sm"
        filled={false}
        onclick={() => field.toggle()}
        class="group flex items-center gap-2 w-fit font-medium"
    >
        {@render children()}
        <div class="transition-enforcement">
            {#if field.direction != null}
                <div transition:scale={{ duration: 150, easing: sineInOut }}>
                    <Icon
                        name="arrow-up"
                        class={clsx(
                            'transition-transform duration-75 ease-out',
                            field.direction === 'desc' && 'rotate-180'
                        )}
                    />
                </div>
            {:else}
                <div transition:scale={{ duration: 150, easing: sineInOut }}>
                    <Icon
                        name="arrows-up-down"
                        class="transition duration-75 ease-out text-base-fg-ghost group-hover:text-base-fg-1"
                    />
                </div>
            {/if}
        </div>
    </Button>
</th>
