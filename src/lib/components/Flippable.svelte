<script lang="ts" context="module">
    let counter = 0;
</script>

<script lang="ts">
    import { browser } from '$app/environment';
    import gsap from 'gsap';
    import Flip from 'gsap/dist/Flip';
    import { tick } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';

    if (browser) {
        gsap.registerPlugin(Flip);
    }

    interface Props extends HTMLAttributes<HTMLDivElement> {
        on: unknown;
    }

    const id = ++counter;
    const { on, children, ...props }: Props = $props();
    let flipState: Flip.FlipState | undefined = undefined;

    $effect.pre(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        on;

        flipState = Flip.getState(`#flippable-${id}`, { simple: true });

        let tl: gsap.core.Timeline | undefined;

        tick().then(() => {
            if (!flipState) {
                return;
            }

            tl = Flip.from(flipState, {
                targets: `#flippable-${id}`,
                duration: 0.15,
                prune: true,
                ease: 'power1.inOut'
            });
        });

        return () => {
            tl?.revert();
        };
    });
</script>

<div id="flippable-{id}" data-flip-id={id} {...props}>
    {#if children}
        {@render children()}
    {/if}
</div>
