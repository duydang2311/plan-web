<script lang="ts">
    import type { PageData } from './$types';
    import Anonymous from './Anonymous.svelte';
    import Authenticated from './Authenticated.svelte';

    const { data }: { data: PageData } = $props();
    const authenticatedData = $derived(data as Required<PageData>);
</script>

{#if data.user}
    <Authenticated data={authenticatedData} />
{:else}
    <Anonymous />
{/if}
