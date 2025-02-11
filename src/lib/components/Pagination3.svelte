<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/state';
    import clsx from 'clsx';
    import gsap from 'gsap';
    import Flip from 'gsap/dist/Flip';
    import { tick, untrack, type Snippet } from 'svelte';
    import type { PaginationHandler } from '../utils/table.svelte';
    import { fluentSearchParams } from '../utils/url';
    import Icon from './Icon.svelte';

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
            <div class="w-full h-full text-center items-center text-base-fg-ghost">...</div>
        {:else}
            {#if pagination.page === value}
                <div
                    bind:this={active}
                    data-flip-id="pagination"
                    class="absolute inset-0 bg-base-active rounded-full"
                ></div>
            {/if}
            <a
                href="{page.url.pathname}{getSearchParams(value).toString()}"
                class={clsx(
                    'block text-center relative w-full h-full content-center rounded-full py-1 transition ease-in-out',
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
    class="rounded-b-xl bg-base-1/20 border-t border-t-base-border-3 backdrop-blur sticky inset-x-0 bottom-0 flex justify-between items-center px-8 py-4"
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
            <span class="font-bold text-base-fg-2">{offset + 1}</span>
            to
            <span class="font-bold text-base-fg-2">{offset + pagination.size}</span>
            of
            <span class="font-bold text-base-fg-2">{pagination.totalCount}</span>
            entries.
        {/if}
    </span>
    <ol class="flex items-stretch text-sm font-bold text-base-fg-4">
        <li>
            <a
                href="{page.url.pathname}{getSearchParams(pagination.page - 1).toString()}"
                class={clsx(
                    'block px-4 h-full content-center rounded-full transition duration-100 ease-in-out',
                    pagination.page === 1
                        ? 'pointer-events-none text-base-fg-3/40'
                        : 'hover:bg-base-hover'
                )}
                data-sveltekit-replacestate
            >
                <Icon name="chevron-left" />
            </a>
        </li>
        {#each pages as page}
            {@render item(page)}
        {/each}
        <li>
            <a
                href="{page.url.pathname}{getSearchParams(pagination.page + 1).toString()}"
                class={clsx(
                    'block px-4 h-full content-center rounded-full transition duration-100 ease-in-out',
                    pagination.page === totalPages
                        ? 'pointer-events-none text-base-fg-3/40'
                        : 'hover:bg-base-hover'
                )}
                data-sveltekit-replacestate
            >
                <Icon name="chevron-right" />
            </a>
        </li>
    </ol>
</div>
