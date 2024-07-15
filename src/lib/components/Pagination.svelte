<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import clsx from 'clsx';
	import gsap from 'gsap';
	import Flip from 'gsap/dist/Flip';
	import { tick, untrack } from 'svelte';
	import Icon from './Icon.svelte';

	interface Props {
		page: number;
		size: number;
		totalCount: number;
	}
	const { page: pageNumber, size, totalCount }: Props = $props();
	const totalPages = $derived(Math.ceil(totalCount / size));
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
		let start = pageNumber - 1;
		while (start <= 1) {
			++start;
		}
		let end = start + 2;
		while (end >= totalPages) {
			if (start > 2) {
				--start;
			}
			--end;
		}
		if (end < start) {
			return [];
		}
		return new Array(end - start + 1).fill(0).map((_, i) => start + i);
	});

	if (browser) {
		gsap.registerPlugin(Flip);
	}

	let active = $state<HTMLDivElement>();
	$effect.pre(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		pageNumber;

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
	<li class="relative">
		{#if pageNumber === page}
			<div
				id="wtf"
				bind:this={active}
				data-flip-id="pagination"
				class="absolute inset-0 bg-base-3 rounded-full"
			></div>
		{/if}
		<a
			data-sveltekit-noscroll
			href="{search}page={page}"
			class={clsx(
				'relative block h-full content-center rounded-full px-4 py-1 transition ease-in-out',
				pageNumber === page ? 'text-base-fg-2' : 'hover:bg-base-3'
			)}
		>
			{page}
		</a>
	</li>
{/snippet}

<ol class="flex items-stretch text-sm font-bold text-base-fg-3">
	{#if totalPages === 1}
		{@render item(1)}
	{:else}
		<li>
			<a
				data-sveltekit-noscroll
				href="{search}page={pageNumber - 1}"
				class={clsx(
					'block px-4 h-full content-center rounded-full transition duration-100 ease-in-out',
					pageNumber === 1 ? 'pointer-events-none text-base-fg-3/40' : 'hover:bg-base-3'
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
				href="{search}page={pageNumber + 1}"
				class={clsx(
					'block px-4 h-full content-center rounded-full transition duration-100 ease-in-out',
					pageNumber === totalPages ? 'pointer-events-none text-base-fg-3/40' : 'hover:bg-base-3'
				)}
			>
				<Icon name="chevron-right" />
			</a>
		</li>
	{/if}
</ol>
