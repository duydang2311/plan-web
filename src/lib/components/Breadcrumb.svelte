<script lang="ts">
	import { page } from '$app/stores';
	import type { HTMLOlAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';
	import Link from './Link.svelte';
	import clsx from 'clsx';

	type Props = HTMLOlAttributes;

	const { ...props }: Props = $props();
</script>

{#if $page.data.routes}
	<ol {...props} class={clsx('flex gap-2 text-sm', props.class)}>
		{#each $page.data.routes.filter((x) => x.breadcrumb) as { meta: { title, href } }, i}
			{@const isLast = i === $page.data.routes.length - 1}
			<li class="flex items-center gap-2 text-base-fg-3">
				{#if isLast}
					<span class="text-base-fg-1 font-bold">
						{title}
					</span>
				{:else}
					<Link {href}>
						{title}
					</Link>
				{/if}
				{#if !isLast}
					<Icon name="chevron-right" />
				{/if}
			</li>
		{/each}
	</ol>
{/if}
