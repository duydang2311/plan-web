<script lang="ts">
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';
	import Breadcrumb from '~/lib/components/Breadcrumb.svelte';
	import Logo from '~/lib/components/Logo.svelte';
	import type { LayoutData } from './$types';
	import Navigation from './Navigation.svelte';
	import { gsap } from 'gsap';

	const { children, data }: { children: Snippet; data: LayoutData } = $props();
	const route = $derived.by(() => {
		const route = $page.data.routes?.at(-1);
		if (route?.breadcrumb) {
			return route;
		}
	});

	function transitateIn(node: Element) {
		gsap.from(node, {
			opacity: 0,
			y: '0.1rem',
			scale: 0.995,
			duration: 0.3,
			ease: 'power2.out'
		});
		return {
			duration: 300
		};
	}
</script>

<svelte:head>
	{#if route}
		<title>{route.meta.title}</title>
	{/if}
</svelte:head>

<div class="flex w-full h-full min-w-screen min-h-screen bg-base-2 p-2 pl-0">
	<aside class="items-stretch px-4 py-2 space-y-4 md:min-w-32 lg:min-w-60">
		<div class="select-none flex items-center gap-2 font-bold text-base-fg-1">
			<Logo class="h-8 w-auto" />
			<p class="hidden md:block">plan</p>
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
					icon: 'users',
					activeIcon: 'users-solid',
					label: 'Teams'
				}
			]}
		/>
	</aside>
	<div
		class="bg-base-1 grow rounded-md border border-base-border shadow-sm grid grid-rows-[auto_1fr] max-h-[calc(100vh-1rem)]"
	>
		<Breadcrumb class="px-8 py-2 border-b border-b-base-border" />
		<div class="transition-enforcement overflow-hidden">
			{#key data.pathname.split('/', 3).join('')}
				<div class="overflow-hidden" in:transitateIn>
					{@render children()}
				</div>
			{/key}
		</div>
	</div>
</div>
