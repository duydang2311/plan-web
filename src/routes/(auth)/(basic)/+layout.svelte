<script lang="ts">
    import type { Snippet } from 'svelte';

    const { children }: { children: Snippet } = $props();
</script>

<div class="flex flex-col min-h-screen max-h-screen max-w-screen">
    {@render children()}
</div>
