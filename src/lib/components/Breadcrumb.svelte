<script lang="ts">
    import { page } from '$app/state';
    import clsx from 'clsx';
    import type { HTMLOlAttributes } from 'svelte/elements';
    import { tsap } from '../utils/transition';
    import Link from './Link.svelte';
    import { IconChevronRight } from './icons';

    type Props = HTMLOlAttributes;

    const { ...props }: Props = $props();
    const routes = $derived(page.data.routes?.filter((a) => a.breadcrumb === true));
</script>

<ol {...props} class={clsx('flex gap-2 text-sm', props.class)}>
    {#if routes}
        {#each routes as { meta: { title, href } }, i}
            {@const notFirst = i !== 0}
            {@const isLast = i === routes.length - 1}
            <li
                class="text-base-fg-3 flex items-center overflow-hidden text-nowrap"
                in:tsap={(node, gsap) =>
                    gsap.from(node, {
                        opacity: 0,
                        duration: 0.2,
                        ease: 'sine.out'
                    })}
            >
                {#if notFirst}
                    <IconChevronRight class={clsx('mr-2', isLast ? 'text-base-fg-1' : undefined)} />
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
    {/if}
</ol>
