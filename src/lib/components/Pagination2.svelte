<script lang="ts">
    import { browser } from '$app/environment';
    import { replaceState } from '$app/navigation';
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
            return Array.from(Array(totalPages)).map((_, i) => i + 1);
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
        replaceState(searchParams.toString(), page.state);
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
            <button
                type="button"
                class={clsx(
                    'relative w-full h-full content-center rounded-full py-1 transition ease-in-out',
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
            <button
                type="button"
                class={clsx(
                    'block px-4 h-full content-center rounded-full transition duration-100 ease-in-out',
                    pagination.page === 1
                        ? 'pointer-events-none text-base-fg-3/40'
                        : 'hover:bg-base-hover'
                )}
                disabled={pagination.page === 1}
                onclick={() => {
                    setPage(pagination.page - 1);
                }}
            >
                <Icon name="chevron-left" />
            </button>
        </li>
        {#each pages as page}
            {@render item(page)}
        {/each}
        <li>
            <button
                type="button"
                class={clsx(
                    'block px-4 h-full content-center rounded-full transition duration-100 ease-in-out',
                    pagination.page === totalPages
                        ? 'pointer-events-none text-base-fg-3/40'
                        : 'hover:bg-base-hover'
                )}
                disabled={pagination.page === totalPages}
                onclick={() => {
                    setPage(pagination.page + 1);
                }}
            >
                <Icon name="chevron-right" />
            </button>
        </li>
    </ol>
</div>
