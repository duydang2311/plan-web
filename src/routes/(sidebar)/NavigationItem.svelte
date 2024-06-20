<script lang="ts" context="module">
	import { circInOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	const [send, receive] = crossfade({ duration: 400, easing: circInOut });
</script>

<script lang="ts">
	import clsx from 'clsx';
	import type { IconName } from '~/lib/components/Icon.svelte';
	import Icon from '~/lib/components/Icon.svelte';

	interface Props {
		href: string;
		icon: IconName;
		activeIcon: IconName;
		label: string;
		isActive: boolean;
	}

	const { href, icon, activeIcon, label, isActive }: Props = $props();
</script>

<li class="relative">
	<a
		{href}
		class={clsx(
			'flex items-center p-2 gap-2 rounded-md transition-[color_background-color_font-weight] ease-in-out hover:bg-base-fg-1/5',
			isActive && 'font-bold group-[:not(:hover)]:bg-base-fg-1/5 text-base-fg-1'
		)}
	>
		{#if isActive}
			<Icon name={activeIcon} />
		{:else}
			<Icon name={icon} />
		{/if}
		<span>{label}</span>
		{#if isActive}
			<div
				in:receive={{ key: 'active' }}
				out:send={{ key: 'active' }}
				class="absolute inset-y-2 -left-4 bg-base-fg-1 w-0.5"
			></div>
		{/if}
	</a>
</li>
