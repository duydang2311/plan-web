<script lang="ts">
	import clsx from 'clsx';
	import type { Snippet } from 'svelte';
	import { circInOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	interface Props {
		children: Snippet;
	}

	const { children }: Props = $props();
</script>

<div
	in:fly|global={{ x: -16, easing: circInOut }}
	class="max-xl:grid max-xl:grid-rows-[auto_1fr] h-full xl:flex xl:h-full"
>
	<ul
		class="text-sm font-medium
		max-xl:flex max-xl:border-b max-xl:border-b-base-border max-xl:py-1 max-xl:px-8 max-xl:gap-1
        xl:p-2 xl:space-y-1 xl:max-h-full xl:min-w-28 xl:border-r xl:border-r-base-border"
	>
		{#each ['General', 'Members', 'Workflows'] as title}
			{@const active = title === 'General'}
			<li class="relative">
				{#if active}
					<div class="absolute inset-0 bg-base-fg-1/5 max-xl:rounded-full xl:rounded-md"></div>
				{/if}
				<!-- svelte-ignore a11y_invalid_attribute -->
				<a
					href="#"
					class={clsx(
						'block relative px-2 py-1',
						!active && 'max-xl:rounded-full xl:rounded-md hover:bg-base-fg-1/5'
					)}
				>
					{title}
				</a>
			</li>
		{/each}
	</ul>
	<div class="bg-base-2 max-xl:h-full xl:grow bg-transparent">
		{@render children()}
	</div>
</div>
