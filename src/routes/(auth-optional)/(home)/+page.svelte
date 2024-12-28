<script lang="ts">
    import type { PageData } from './$types';
    import Anonymous from './Anonymous.svelte';
    import Authenticated from './Authenticated.svelte';

    const { data }: { data: PageData } = $props();
</script>

{#if data.user}
    <Authenticated {data} />
{:else}
    <Anonymous />
{/if}
