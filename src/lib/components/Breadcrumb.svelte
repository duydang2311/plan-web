<script lang="ts">
    import { page } from '$app/stores';
    import clsx from 'clsx';
    import type { HTMLOlAttributes } from 'svelte/elements';
    import { tsap } from '../utils/transition';
    import Icon from './Icon.svelte';
    import Link from './Link.svelte';

    type Props = HTMLOlAttributes;

    const { ...props }: Props = $props();
    const routes = $derived($page.data.routes?.filter((x) => x.breadcrumb === true));
</script>

{#if routes}
    <ol {...props} class={clsx('flex gap-2 text-sm', props.class)}>
        {#each routes as { meta: { title, href } }, i (href)}
            {@const notFirst = i !== 0}
            {@const isLast = i === routes.length - 1}
            <li
                class="flex items-center text-base-fg-3 overflow-hidden text-nowrap"
                in:tsap={(node, gsap) =>
                    gsap.from(node, {
                        width: 0,
                        duration: 0.2,
                        ease: 'cubic.inOut'
                    })}
                out:tsap={(node, gsap) =>
                    gsap.to(node, {
                        width: 0,
                        duration: 0.2,
                        ease: 'cubic.inOut'
                    })}
            >
                {#if notFirst}
                    <Icon
                        name="chevron-right"
                        class={clsx('mr-2', isLast ? 'text-base-fg-1' : undefined)}
                    />
                {/if}
                {#if isLast}
                    <span class="text-base-fg-1 font-bold">
                        {title}
                    </span>
                {:else}
                    <Link {href}>
                        {title}
                    </Link>
                {/if}
            </li>
        {/each}
    </ol>
{/if}
