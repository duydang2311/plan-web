<script lang="ts">
	import type { Snippet } from 'svelte';
	import Logo from '~/lib/components/Logo.svelte';
	import Navigation from './Navigation.svelte';
	import { page } from '$app/stores';

	const { children }: { children: Snippet } = $props();
</script>

<div class="flex w-full h-full min-w-screen min-h-screen bg-base-2 p-2 pl-0">
	<aside class="items-stretch w-60 px-4 py-2 space-y-4">
		<div class="select-none flex items-center gap-2 font-bold text-base-fg-1">
			<Logo class="h-8 w-auto" />
			<p>plan</p>
		</div>
		<hr class="-mx-4 text-base-border" />
		<Navigation
			items={[
				{
					href: `/${$page.params['path']}`,
					icon: 'home',
					activeIcon: 'home-solid',
					label: 'Home'
				},
				{
					href: `/${$page.params['path']}/teams`,
					icon: 'user-group-outline',
					activeIcon: 'user-group',
					label: 'Teams'
				}
			]}
		/>
	</aside>
	<main class="bg-base-1 grow rounded-md border border-base-border shadow-sm p-16">
		<div class="max-w-6xl mx-auto">
			{@render children()}
		</div>
	</main>
</div>
