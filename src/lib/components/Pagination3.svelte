<script lang="ts">
    import { browser } from '$app/environment';
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
        if (pagination.page < 4) {
            return [1, 2, 3, 4, 5, ellipse, totalPages];
        }

        if (pagination.page < totalPages - 3) {
            return [
                1,
                ellipse,
                ...Array.from(Array(3)).map((_, i) => i + pagination.page - 1),
                ellipse,
                totalPages
            ];
        }

        return [1, ellipse, ...Array.from(Array(5)).map((_, i) => i + totalPages - 4)];
    });

    const getSearchParams = (pageNumber: number) => {
        const params = fluentSearchParams(page.url);
        return pageNumber === 1 ? params.delete('page') : params.set('page', pageNumber + '');
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
            <a
                href="{page.url.pathname}{getSearchParams(value).toString()}"
                class={clsx(
                    'relative block h-full w-full content-center rounded-full py-1 text-center transition',
                    pagination.page === value
                        ? 'text-base-fg-2 pointer-events-none'
                        : 'hover:bg-base-hover'
                )}
                data-sveltekit-replacestate
            >
                {value}
            </a>
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
            <a
                href="{page.url.pathname}{getSearchParams(pagination.page - 1).toString()}"
                class={clsx(
                    'block h-full content-center rounded-full px-4 transition duration-100',
                    pagination.page === 1
                        ? 'text-base-fg-3/40 pointer-events-none'
                        : 'hover:bg-base-hover'
                )}
                data-sveltekit-replacestate
            >
                <IconChevronLeft />
            </a>
        </li>
        {#each pages as page}
            {@render item(page)}
        {/each}
        <li>
            <a
                href="{page.url.pathname}{getSearchParams(pagination.page + 1).toString()}"
                class={clsx(
                    'block h-full content-center rounded-full px-4 transition duration-100',
                    pagination.page === totalPages
                        ? 'text-base-fg-3/40 pointer-events-none'
                        : 'hover:bg-base-hover'
                )}
                data-sveltekit-replacestate
            >
                <IconChevronRight />
            </a>
        </li>
    </ol>
</div>
