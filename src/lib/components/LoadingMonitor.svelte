<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import type { Loading } from '../utils/runes.svelte';
    import { tsap } from '../utils/transition';
    import type { Snippet } from 'svelte';
    import Spinner2 from './Spinner2.svelte';

    interface Props extends HTMLAttributes<HTMLDivElement> {
        loading: Loading;
        loader?: Snippet;
    }

    const { loading, loader = defaultLoader, class: cls, children, ...props }: Props = $props();
</script>

{#snippet defaultLoader()}
    <Spinner2 />
{/snippet}

<div class={['transition-enforcement', cls]} {...props}>
    {#if loading.short}
        <div
            in:tsap={(node, gsap) =>
                gsap.from(node, {
                    scale: 0,
                    duration: 0.15,
                    ease: 'sine.in',
                    clearProps: 'scale,opacity'
                })}
            out:tsap={(node, gsap) =>
                gsap.to(node, { scale: 0, opacity: 0, duration: 0.15, ease: 'sine.out' })}
        >
            {@render loader()}
        </div>
    {:else}
        <div
            in:tsap={(node, gsap) =>
                gsap.from(node, {
                    scale: 0,
                    duration: 0.15,
                    ease: 'sine.in',
                    clearProps: 'scale,opacity'
                })}
            out:tsap={(node, gsap) =>
                gsap.to(node, { scale: 0, opacity: 0, duration: 0.15, ease: 'sine.out' })}
        >
            {@render children?.()}
        </div>
    {/if}
</div>
