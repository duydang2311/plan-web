<script lang="ts">
    import { page } from '$app/state';
    import clsx from 'clsx';
    import { sineInOut } from 'svelte/easing';
    import type { HTMLThAttributes } from 'svelte/elements';
    import { scale } from 'svelte/transition';
    import { IconArrowsUpDown, IconArrowUp } from './icons';

    type Props = ({ sortable?: never } | { sortable: true; name: string }) & HTMLThAttributes;

    const { children, ...props }: Props = $props();
    const state: [boolean | null, URLSearchParams] | null = $derived.by(() => {
        if (!props.sortable) return null;
        const cloned = new URLSearchParams(page.url.searchParams);
        const sort = cloned.get('order');
        if (!sort) {
            cloned.set('order', props.name);
        } else {
            const names = sort.split(',');
            for (let i = 0, size = names.length; i !== size; ++i) {
                let ascending = names[i][0] !== '-';
                if (
                    props.name === names[i] ||
                    (!ascending && props.name === names[i].substring(1))
                ) {
                    if (!ascending) {
                        names.splice(i, 1);
                        if (names.length === 0) {
                            cloned.delete('order');
                            return [ascending, cloned];
                        }
                    } else {
                        names[i] = ascending ? `-${props.name}` : props.name;
                    }
                    cloned.set('order', names.join(','));
                    return [ascending, cloned];
                }
            }
            names.push(props.name);
            cloned.set('order', names.join(','));
        }
        return [null, cloned];
    });
</script>

<th {...props} class={clsx('c-table--th', props.sortable && 'c-table--th-sort', props.class)}>
    {#if props.sortable === true && state}
        <a
            href="?{state[1].toString()}"
            class="group flex items-center gap-2"
            data-sveltekit-replacestate
        >
            {@render children?.()}
            <div class="transition-enforcement">
                {#if state[0] != null}
                    <div transition:scale={{ duration: 150, easing: sineInOut }}>
                        <IconArrowUp
                            class={clsx('transition-transform', state[0] === false && 'rotate-180')}
                        />
                    </div>
                {:else}
                    <div transition:scale={{ duration: 150, easing: sineInOut }}>
                        <IconArrowsUpDown
                            name="arrows-up-down"
                            class="text-base-fg-ghost transition group-hover:text-current"
                        />
                    </div>
                {/if}
            </div>
        </a>
    {:else}
        {@render children?.()}
    {/if}
</th>
