<script lang="ts">
    import type { Snippet } from 'svelte';

    const { children }: { children: Snippet } = $props();
</script>

<div class="flex flex-col overflow-auto min-h-screen max-h-screen px-4 py-2">
    {@render children()}
</div>
