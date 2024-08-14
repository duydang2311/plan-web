<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import clsx from 'clsx';
    import gsap from 'gsap';
    import Flip from 'gsap/dist/Flip';
    import { tick, untrack, type Snippet } from 'svelte';
    import Icon from './Icon.svelte';
    import type { PaginatedList } from '../models/paginatedList';

    type Props = (
        | {
              offset: number;
              page: number;
              size: number;
              query?: never;
          }
        | {
              query: { offset: number; page: number; size: number };
              offset?: never;
              page?: never;
              size?: never;
          }
    ) &
        (
            | {
                  length: number;
                  totalCount: number;
                  list?: never;
              }
            | {
                  list: PaginatedList<unknown>;
                  length?: never;
                  totalCount?: never;
              }
        ) & {
            label?: Snippet<[{ from: number; to: number; totalCount: number }]>;
        };
    const { label, ...props }: Props = $props();
    const query = $derived(
        props.query ? props.query : { page: props.page, size: props.size, offset: props.offset }
    );
    const list = $derived(
        props.list
            ? { length: props.list.items.length, totalCount: props.list.totalCount }
            : { length: props.length, totalCount: props.totalCount }
    );
    const totalPages = $derived(Math.ceil(list.totalCount / query.size));
    const search = $derived.by(() => {
        const searchParams = $page.url.searchParams;
        searchParams.delete('page');
        const search = searchParams.toString();
        if (search.length) {
            return `?${search}&`;
        }
        return '?';
    });
    const pageNumbers = $derived.by(() => {
        if (query.page > totalPages || query.page < 1) return [];
        const size = 1;
        const pivot = query.page;
        const mid = Math.floor(totalPages / 2);
        let start = pivot - size;
        let end = pivot + size;

        // one sided bias
        if (pivot > mid) start -= size;
        else end += size;

        // translate start/end accordingly
        if (start <= 1) {
            const gap = 1 - start + 1;
            end += gap;
            start += gap;
        } else if (end >= totalPages) {
            const gap = end - totalPages + 1;
            end -= gap;
            start -= gap;
        }

        // make sure not out of bound
        if (start < 1) start = 2;
        if (end >= totalPages) end = totalPages - 1;
        if (end < start) return [];

        // add half jump
        let arr = new Array(end - start + 1).fill(0).map((_, i) => start + i);
        const halfStart = Math.floor(start / 2);
        if (halfStart < start && halfStart > 1) {
            arr.unshift(halfStart);
        } else if (end + 1 < totalPages) {
            arr.push(end + 1);
        }
        const halfEnd = Math.floor(end + (totalPages - end) / 2);
        if (halfEnd > end && halfEnd < totalPages) {
            arr.push(halfEnd);
        } else if (start - 1 > 1) {
            arr.unshift(arr[0]);
            arr[0] = start - 1;
        }

        return arr;
    });

    if (browser) {
        gsap.registerPlugin(Flip);
    }

    let active = $state<HTMLDivElement>();
    $effect.pre(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        query.page;

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

{#snippet item(page: number)}
    <li class="relative w-12 text-center">
        {#if query.page === page}
            <div
                bind:this={active}
                data-flip-id="pagination"
                class="absolute inset-0 bg-base-3 rounded-full"
            ></div>
        {/if}
        <a
            data-sveltekit-noscroll
            href="{search}page={page}"
            class={clsx(
                'relative block h-full content-center rounded-full py-1 transition ease-in-out',
                query.page === page ? 'text-base-fg-2' : 'hover:bg-base-3'
            )}
        >
            {page}
        </a>
    </li>
{/snippet}

<div
    class="rounded-b-md bg-base-1/60 border-t border-t-[var(--theme-table-border)] backdrop-blur sticky inset-x-0 bottom-0 flex justify-between items-center px-8 py-4"
>
    <span class="text-base-fg-3 text-sm font-bold">
        {#if list.length === 0}
            Nothing to display.
        {:else if label}
            {@render label({
                from: query.offset + 1,
                to: query.offset + list.length,
                totalCount: list.totalCount
            })}
        {:else}
            Displaying {query.offset + 1} - {query.offset + length} out of {list.totalCount} items.
        {/if}
    </span>
    <ol class="flex items-stretch text-sm font-bold text-base-fg-3">
        {#if totalPages <= 1}
            {@render item(1)}
        {:else}
            <li>
                <a
                    data-sveltekit-noscroll
                    href="{search}page={query.page - 1}"
                    class={clsx(
                        'block px-4 h-full content-center rounded-full transition duration-100 ease-in-out',
                        query.page === 1
                            ? 'pointer-events-none text-base-fg-3/40'
                            : 'hover:bg-base-3'
                    )}
                >
                    <Icon name="chevron-left" />
                </a>
            </li>
            {@render item(1)}
            {#each pageNumbers as page}
                {@render item(page)}
            {/each}
            {@render item(totalPages)}
            <li>
                <a
                    data-sveltekit-noscroll
                    href="{search}page={query.page + 1}"
                    class={clsx(
                        'block px-4 h-full content-center rounded-full transition duration-100 ease-in-out',
                        query.page === totalPages
                            ? 'pointer-events-none text-base-fg-3/40'
                            : 'hover:bg-base-3'
                    )}
                >
                    <Icon name="chevron-right" />
                </a>
            </li>
        {/if}
    </ol>
</div>
