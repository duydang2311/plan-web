<script lang="ts">
    import type { Field } from '@vincjo/datatables';
    import type { TableHandlerInterface } from '@vincjo/datatables/server';
    import type { Snippet } from 'svelte';
    import { sineInOut } from 'svelte/easing';
    import type { HTMLThAttributes } from 'svelte/elements';
    import { scale } from 'svelte/transition';
    import { Button } from '.';
    import { IconArrowsUpDown, IconArrowUp } from './icons';

    type T = $$Generic<Row>;
    interface Props {
        table: TableHandlerInterface<T>;
        field: Field<T>;
        children: Snippet;
        html?: HTMLThAttributes;
    }
    const { table, field, children, html }: Props = $props();
    const { class: cls, ...restProps } = $derived(html ?? {});
    const sort = table.createSort(field);
</script>

<th {...restProps} class={['c-table--th c-table--th-sort', cls]}>
    <Button
        type="button"
        variant="base"
        size="sm"
        filled={false}
        onclick={() => sort.set()}
        class="group flex w-fit items-center gap-2"
    >
        {@render children()}
        <div class="transition-enforcement">
            {#if sort.isActive}
                <div transition:scale={{ duration: 150, easing: sineInOut }}>
                    <IconArrowUp
                        class={[
                            'transition-transform duration-75 ease-out',
                            sort.direction === 'desc' && 'rotate-180'
                        ]}
                    />
                </div>
            {:else}
                <div transition:scale={{ duration: 150, easing: sineInOut }}>
                    <IconArrowsUpDown
                        class="text-base-fg-ghost group-hover:text-base-fg-1 transition duration-75 ease-out"
                    />
                </div>
            {/if}
        </div>
    </Button>
</th>
