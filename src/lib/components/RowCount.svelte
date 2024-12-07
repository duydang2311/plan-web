<script lang="ts">
    import type { TableHandlerInterface } from '@vincjo/datatables/server';

    type T = $$Generic<Row>;
    let { table, selection = false }: { table: TableHandlerInterface<T>; selection?: boolean } =
        $props();

    const { start, end, total, selected } = $derived(table.rowCount);
</script>

<aside class="text-base-fg-4 text-sm font-medium">
    {#if selection}
        {@render selectedRows()}
    {:else}
        <div class="md:hidden">
            {@render small()}
        </div>
        <div class="max-md:hidden">
            {@render rowCount()}
        </div>
    {/if}
</aside>

{#snippet selectedRows()}
    <b class="text-base-fg-3">{selected}</b>
    {#if total}
        of <b class="text-base-fg-3">{total}</b>
    {/if}
    row(s) selected.
    {#if selected > 0}
        <button type="button" onclick={() => table.clearSelection()}>❌ Clear</button>
    {/if}
{/snippet}

{#snippet small()}
    {#if total > 0}
        <b class="text-base-fg-3">{start}</b>-
        <b class="text-base-fg-3">{end}</b>/
        <b class="text-base-fg-3">{total}</b>
    {:else}
        {table.i18n.noRows}
    {/if}
{/snippet}

{#snippet rowCount()}
    {#if total > 0}
        Showing <b class="text-base-fg-3">{start}</b> to <b class="text-base-fg-3">{end}</b> of
        <b class="text-base-fg-3">{total}</b> entries.
    {:else}
        {table.i18n.noRows}
    {/if}
{/snippet}
