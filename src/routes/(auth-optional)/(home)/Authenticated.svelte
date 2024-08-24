<script lang="ts">
    import type { PageData } from './$types';
    import TeamInvitations from './TeamInvitations.svelte';

    const { data }: { data: Required<PageData> } = $props();
</script>

<main class="space-y-8 p-4">
    <h1>Dashboard</h1>
    <TeamInvitations {data} />
</main>
