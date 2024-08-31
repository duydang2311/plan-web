<script lang="ts">
    import type { Snippet } from 'svelte';
    import Navigation from './Navigation.svelte';

    const { children }: { children: Snippet } = $props();
</script>

<div>
    <Navigation />
    {@render children()}
</div>
