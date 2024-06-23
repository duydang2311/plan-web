<script lang="ts" context="module">
	let counter = 0;
</script>

<script lang="ts">
	import { browser } from '$app/environment';
	import gsap from 'gsap';
	import Flip from 'gsap/dist/Flip';
	import type { HTMLAttributes } from 'svelte/elements';

	if (browser) {
		gsap.registerPlugin(Flip);
	}

	interface Props extends HTMLAttributes<HTMLDivElement> {
		on: unknown;
	}

	const id = ++counter;
	const { on, children, ...props }: Props = $props();
	let div = $state<HTMLDivElement>();
	let flipState: Flip.FlipState | undefined = undefined;

	$effect(() => {
		if (!div) return;

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		on;

		if (flipState) {
			const timeline = Flip.from(flipState, {
				targets: div,
				duration: 0.15,
				ease: 'power1.inOut',
				prune: true,
				onComplete: () => {
					if (!div) return;
					flipState = Flip.getState(div, { simple: true });
				}
			});
			return () => {
				timeline.kill();
			};
		} else {
			flipState = Flip.getState(div, { simple: true });
		}
	});
</script>

<div bind:this={div} data-flip-id={id} {...props}>
	{#if children}
		{@render children()}
	{/if}
</div>
