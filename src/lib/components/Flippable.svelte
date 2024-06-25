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
	let div = $state<HTMLDivElement>();
	let flipState: Flip.FlipState | undefined = undefined;

	$effect.pre(() => {
		if (!div) return;

		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		on;

		if (flipState) {
			let timeline: gsap.core.Timeline;
			tick().then(() => {
				if (!flipState) return;
				timeline = Flip.from(flipState, {
					targets: div,
					duration: 0.15,
					prune: true,
					ease: 'power1.inOut',
					onComplete: () => {
						if (!div) return;
						flipState = Flip.getState(div, { simple: true });
					}
				});
			});
			return () => {
				timeline?.kill();
			};
		} else {
			tick().then(() => {
				if (!div) return;
				flipState = Flip.getState(div, { simple: true });
			});
			flipState = Flip.getState(div, { simple: true });
		}
	});
</script>

<div bind:this={div} data-flip-id={id} {...props}>
	{#if children}
		{@render children()}
	{/if}
</div>
