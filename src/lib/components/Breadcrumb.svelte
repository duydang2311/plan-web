<script lang="ts">
	import { page } from '$app/stores';
	import clsx from 'clsx';
	import { cubicInOut } from 'svelte/easing';
	import type { HTMLOlAttributes } from 'svelte/elements';
	import { slide } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import Link from './Link.svelte';

	type Props = HTMLOlAttributes;

	const { ...props }: Props = $props();
</script>

{#if $page.data.routes}
	<ol {...props} class={clsx('flex gap-2 text-sm', props.class)}>
		{#each $page.data.routes.filter((x) => x.breadcrumb) as { meta: { title, href } }, i (href)}
			{@const notFirst = i !== 0}
			{@const isLast = i === $page.data.routes.length - 1}
			<li
				class="flex items-center text-base-fg-3 overflow-hidden text-nowrap"
				transition:slide={{ axis: 'x', duration: 200, easing: cubicInOut }}
			>
				{#if notFirst}
					<Icon name="chevron-right" class={clsx('mr-2', isLast ? 'text-base-fg-1' : undefined)} />
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
