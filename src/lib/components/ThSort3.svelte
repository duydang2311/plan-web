<script lang="ts">
    import { page } from '$app/state';
    import clsx from 'clsx';
    import { sineInOut } from 'svelte/easing';
    import type { HTMLThAttributes } from 'svelte/elements';
    import { scale } from 'svelte/transition';
    import { type FluentSearchParams, fluentSearchParams } from '../utils/url';
    import Icon from './Icon.svelte';

    interface Props extends HTMLThAttributes {
        name: string;
    }

    const { name, children, ...props }: Props = $props();
    const state: ['asc' | 'desc' | null, FluentSearchParams] = $derived.by(() => {
        const minus = '-'.charCodeAt(0);
        const orders = page.url.searchParams
            .getAll('order')
            .filter((a) => a.length !== 0)
            .map((a) => a.split(','))
            .flatMap((a) => a);
        const params = fluentSearchParams(page.url);
        let direction: 'asc' | 'desc' | null = null;
        for (let i = 0, size = orders.length; i !== size; ++i) {
            const order = orders[i];
            const isDesc = order.charCodeAt(0) === minus;
            if (name === (isDesc ? order.substring(1) : order)) {
                if (isDesc) {
                    direction = 'desc';
                    orders.splice(i, 1);
                } else {
                    direction = 'asc';
                    orders[i] = `-${orders[i]}`;
                }
                break;
            }
        }
        if (direction == null) {
            orders.push(name);
        }
        if (orders.length === 0) {
            return [direction, params.delete('order')];
        }
        return [direction, params.set('order', orders.join(','))];
    });
</script>

<th {...props} class={['c-table--th', props.class]}>
    <a
        href="{page.url.pathname}{state[1].toString()}"
        class="group flex items-center gap-2"
        data-sveltekit-replacestate
    >
        {@render children?.()}
        <div class="transition-enforcement">
            {#if state[0] != null}
                <div transition:scale={{ duration: 150, easing: sineInOut }}>
                    <Icon
                        name="arrow-up"
                        class={clsx(
                            'transition-transform ease-in-out',
                            state[0] === 'desc' && 'rotate-180'
                        )}
                    />
                </div>
            {:else}
                <div transition:scale={{ duration: 150, easing: sineInOut }}>
                    <Icon
                        name="arrows-up-down"
                        class="transition ease-in-out text-base-fg-ghost group-hover:text-current"
                    />
                </div>
            {/if}
        </div>
    </a>
</th>
