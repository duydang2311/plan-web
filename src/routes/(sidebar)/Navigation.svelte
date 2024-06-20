<script lang="ts">
	import type { IconName } from '~/lib/components/Icon.svelte';
	import NavigationItem from './NavigationItem.svelte';
	import { page } from '$app/stores';

	interface Props {
		items: {
			href: string;
			icon: IconName;
			activeIcon: IconName;
			label: string;
		}[];
	}

	const { items }: Props = $props();
	const pathname = $derived($page.url.pathname);
</script>

<ul class="font-medium group">
	{#each items as { href, icon, activeIcon, label }}
		<NavigationItem {href} isActive={pathname.startsWith(href)} {icon} {activeIcon} {label} />
	{/each}
</ul>
