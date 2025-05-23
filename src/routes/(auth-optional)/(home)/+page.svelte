<script lang="ts">
    import type { PageData } from './$types';
    import Authenticated from './Authenticated.svelte';
    import AnonymousLandingPage from './AnonymousLandingPage.svelte';

    const { data }: { data: PageData } = $props();
</script>

{#if data.user != null}
    <!-- TODO: data.user?.id as a workaround should be removed when sveltejs/kit#12851 is fixed -->
    <Authenticated userId={data.user?.id} />
{:else}
    <AnonymousLandingPage />
{/if}
