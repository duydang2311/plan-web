<script lang="ts">
	import clsx from 'clsx';
	import type { IconName } from '~/lib/components/Icon.svelte';
	import Icon from '~/lib/components/Icon.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		href: string;
		icon: IconName;
		activeIcon: IconName;
		label: string;
		isActive: boolean;
		children: Snippet;
	}

	const { href, icon, activeIcon, label, isActive, children }: Props = $props();
</script>

<li class="relative">
	<a
		{href}
		class={clsx(
			'flex items-center p-2 gap-2 rounded-md transition-[color_background-color_font-weight] ease-in-out hover:bg-base-fg-1/5',
			isActive && 'font-bold group-[:not(:hover)]:bg-base-fg-1/5 text-base-fg-1'
		)}
	>
		<div class="transition-enforcement">
			<Icon
				name={activeIcon}
				class={clsx('transition-opacity ease-in-out duration-200', !isActive && 'opacity-0')}
				aria-hidden={!isActive}
			/>
			<Icon
				name={icon}
				class={clsx('transition-opacity ease-in-out duration-200', isActive && 'opacity-0')}
				aria-hidden={isActive}
			/>
		</div>
		<span class="hidden md:inline">{label}</span>
		{@render children()}
	</a>
</li>
