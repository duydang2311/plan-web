<script lang="ts">
    import { browser } from '$app/environment';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    import clsx from 'clsx';
    import gsap from 'gsap';
    import Flip from 'gsap/dist/Flip';
    import { tick, untrack, type Snippet } from 'svelte';
    import type { PaginationHandler } from '../utils/table.svelte';
    import { fluentSearchParams } from '../utils/url';
    import { IconChevronLeft, IconChevronRight } from './icons';

    interface Props {
        pagination: PaginationHandler;
        label?: Snippet<[{ from: number; to: number; totalCount: number }]>;
    }

    const { pagination, label }: Props = $props();
    const offset = $derived((pagination.page - 1) * pagination.rowsPerPage);
    const totalPages = $derived(Math.ceil(pagination.totalCount / pagination.rowsPerPage));
    const pages = $derived.by(() => {
        if (totalPages <= 7) {
            return Array.from(Array(Math.max(totalPages, 1))).map((_, i) => i + 1);
        }
        const ellipse = null;
        const firstPage = 1;
        const lastPage = totalPages - 1;
        if (pagination.page < 4) {
            return [1, 2, 3, 4, 5, ellipse, lastPage];
        }

        if (pagination.page < totalPages - 3) {
            return [
                firstPage,
                ellipse,
                ...Array.from(Array(3)).map((_, i) => i + pagination.page - 1),
                ellipse,
                lastPage
            ];
        }

        return [firstPage, ellipse, ...Array.from(Array(5)).map((_, i) => i + totalPages - 4)];
    });

    const setPage = (value: number) => {
        pagination.page = value;
        const searchParams = fluentSearchParams(page.url);
        if (value === 1) {
            searchParams.delete('page');
        } else {
            searchParams.set('page', value + '');
        }
        goto(`${page.url.pathname}${searchParams.toString()}`, {
            replaceState: true,
            state: page.state
        });
    };

    if (browser) {
        gsap.registerPlugin(Flip);
    }

    let active = $state<HTMLDivElement>();
    $effect.pre(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        pagination.page;

        const state = Flip.getState(untrack(() => active!));
        tick().then(() => {
            Flip.from(state, {
                targets: active,
                duration: 0.3,
                ease: 'power2.inOut'
            });
        });
    });
</script>

{#snippet item(value: number | null)}
    <li class="relative w-12">
        {#if value == null}
            <div class="text-base-fg-ghost h-full w-full items-center text-center">...</div>
        {:else}
            {#if pagination.page === value}
                <div
                    bind:this={active}
                    data-flip-id="pagination"
                    class="bg-base-active absolute inset-0 rounded-full"
                ></div>
            {/if}
            <button
                type="button"
                class={clsx(
                    'relative h-full w-full content-center rounded-full py-1 transition',
                    pagination.page === value ? 'text-base-fg-2' : 'hover:bg-base-hover'
                )}
                disabled={pagination.page === value}
                onclick={() => {
                    setPage(value);
                }}
            >
                {value}
            </button>
        {/if}
    </li>
{/snippet}

<div
    class="bg-base-1/20 border-t-base-border-3 sticky inset-x-0 bottom-0 flex items-center justify-between rounded-b-xl border-t px-8 py-4 backdrop-blur"
>
    <span class="text-base-fg-4 text-sm font-medium">
        {#if pagination.totalCount === 0}
            No entries found.
        {:else if label}
            {@render label({
                from: offset + 1,
                to: offset + pagination.size,
                totalCount: pagination.totalCount
            })}
        {:else}
            Showing
            <span class="text-base-fg-2 font-bold">{offset + 1}</span>
            to
            <span class="text-base-fg-2 font-bold">{offset + pagination.size}</span>
            of
            <span class="text-base-fg-2 font-bold">{pagination.totalCount}</span>
            entries.
        {/if}
    </span>
    <ol class="text-base-fg-4 flex items-stretch text-sm font-bold">
        <li>
            <button
                type="button"
                class={clsx(
                    'block h-full content-center rounded-full px-4 transition duration-100',
                    pagination.page === 1
                        ? 'text-base-fg-3/40 pointer-events-none'
                        : 'hover:bg-base-hover'
                )}
                disabled={pagination.page === 1}
                onclick={() => {
                    setPage(pagination.page - 1);
                }}
            >
                <IconChevronLeft />
            </button>
        </li>
        {#each pages as page}
            {@render item(page)}
        {/each}
        <li>
            <button
                type="button"
                class={clsx(
                    'block h-full content-center rounded-full px-4 transition duration-100',
                    pagination.page === totalPages
                        ? 'text-base-fg-3/40 pointer-events-none'
                        : 'hover:bg-base-hover'
                )}
                disabled={pagination.page === totalPages}
                onclick={() => {
                    setPage(pagination.page + 1);
                }}
            >
                <IconChevronRight />
            </button>
        </li>
    </ol>
</div>
