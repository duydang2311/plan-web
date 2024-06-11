<script lang="ts">
	import type { Snippet } from 'svelte';
	import './+layout.css';

	const { children }: { children: Snippet } = $props();
</script>

{@render children()}
