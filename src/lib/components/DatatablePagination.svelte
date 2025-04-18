<script lang="ts">
    import { browser } from '$app/environment';
    import type { TableHandlerInterface } from '@vincjo/datatables/server';
    import clsx from 'clsx';
    import gsap from 'gsap';
    import Flip from 'gsap/dist/Flip';
    import { tick, untrack } from 'svelte';
    import { IconChevronLeft, IconChevronRight } from './icons';

    type T = $$Generic<Row>;
    const { table }: { table: TableHandlerInterface<T> } = $props();

    if (browser) {
        gsap.registerPlugin(Flip);
    }

    let activeRef = $state<HTMLDivElement>();
    $effect.pre(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        table.currentPage;

        untrack(() => {
            if (!activeRef) {
                return;
            }
            const state = Flip.getState(untrack(() => activeRef!));
            tick().then(() => {
                Flip.from(state, {
                    targets: activeRef,
                    duration: 0.2,
                    ease: 'circ.inOut'
                });
            });
        });
    });
</script>

<section class="text-sm">
    {#if table.pages === undefined}
        {@render nopage()}
    {:else}
        <div class="flex md:hidden">
            {@render small()}
        </div>
        <div class="hidden md:flex">
            {@render ellipsis()}
        </div>
    {/if}
</section>

{#snippet nopage()}
    <button
        type="button"
        class="small"
        class:disabled={table.currentPage === 1}
        onclick={() => table.setPage('previous')}
    >
        &#10094;
    </button>
    <button type="button" class="page">Page <b>{table.currentPage}</b></button>
    <button type="button" class="small" onclick={() => table.setPage('next')}> &#10095; </button>
{/snippet}

{#snippet small()}
    <button
        type="button"
        onclick={() => table.setPage(1)}
        disabled={table.currentPage === 1}
        class="c-table--pagination--button relative block w-max min-w-10 content-center rounded-full py-1 transition-colors ease-out"
    >
        &#10092;&#10092;
    </button>
    <button
        type="button"
        onclick={() => table.setPage('previous')}
        disabled={table.currentPage === 1}
        class="c-table--pagination--button relative block w-max min-w-10 content-center rounded-full py-1 transition-colors ease-out"
    >
        <IconChevronLeft class="mx-auto" />
    </button>
    <button
        type="button"
        onclick={() => table.setPage('next')}
        disabled={table.currentPage === table.pageCount}
        class="c-table--pagination--button relative block w-max min-w-10 content-center rounded-full py-1 transition-colors ease-out"
    >
        <IconChevronRight class="mx-auto" />
    </button>
    <button
        type="button"
        onclick={() => table.setPage('last')}
        disabled={table.currentPage === table.pageCount}
        class="c-table--pagination--button relative block w-max min-w-10 content-center rounded-full py-1 transition-colors ease-out"
    >
        &#10093;&#10093;
    </button>
{/snippet}

{#snippet ellipsis()}
    <button
        type="button"
        onclick={() => table.setPage('previous')}
        disabled={table.currentPage === 1}
        class="c-table--pagination--button relative block w-max min-w-10 content-center rounded-full py-1 transition-colors ease-out"
    >
        <IconChevronLeft class="mx-auto" />
    </button>
    {#each table.pagesWithEllipsis as page}
        {#if page}
            {@render item(page)}
        {:else}
            <div
                class="text-base-fg-ghost w-max min-w-10 cursor-default content-center py-1 text-center"
            >
                ...
            </div>
        {/if}
    {/each}
    <button
        type="button"
        onclick={() => table.setPage('next')}
        disabled={table.currentPage === table.pageCount}
        class="c-table--pagination--button relative block w-max min-w-10 content-center rounded-full py-1 transition-colors ease-out"
    >
        <IconChevronRight class="mx-auto" />
    </button>
{/snippet}

{#snippet item(page: number)}
    {@const active = table.currentPage === page}
    <div class="relative">
        {#if active}
            <div
                bind:this={activeRef}
                data-flip-id="pagination-active"
                class="bg-base-5 absolute inset-0 rounded-full"
            ></div>
        {/if}
        <button
            type="button"
            onclick={() => table.setPage(page)}
            disabled={active}
            class={clsx(
                'relative w-max min-w-10 content-center rounded-full py-1 font-bold transition-colors ease-out',
                active ? 'text-base-fg-2' : 'text-base-fg-5 hover:text-base-fg-2 hover:bg-base-3'
            )}
        >
            {page ?? '...'}
        </button>
    </div>
{/snippet}

<style>
    .c-table--pagination--button {
        color: var(--color-base-fg-5);
        &:not(:disabled) {
            &:hover {
                color: var(--color-base-fg-2);
                background-color: var(--color-base-4);
            }
            &:active {
                background-color: var(--color-base-active);
            }
        }
        &:disabled {
            color: var(--color-base-fg-ghost);
        }
    }
</style>
