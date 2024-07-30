<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import './+layout.css';
	import Toaster from '~/lib/components/Toaster.svelte';

	const { children }: { children: Snippet } = $props();

	function onColorSchemePreferenceChange(e: MediaQueryListEvent) {
		if (e.matches) {
			document.documentElement.setAttribute('data-theme', 'dark');
		} else {
			document.documentElement.setAttribute('data-theme', 'light');
		}
	}

	onMount(() => {
		const theme = localStorage.getItem('theme');
		if (!theme || theme === 'system') {
			const media = window.matchMedia('(prefers-color-scheme: dark)');
			media.addEventListener('change', onColorSchemePreferenceChange);
			return () => {
				media.removeEventListener('change', onColorSchemePreferenceChange);
			};
		}
	});
</script>

<Toaster />
{@render children()}
