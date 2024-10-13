<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import type { PageData } from './$types';
    import { page } from '$app/stores';

    const { data }: { data: PageData } = $props();
    const queryKey = ['profiles', { profileName: $page.params['profileName'] }];
    const query = createQuery({
        queryKey,
        queryFn: () => data.profile
    });
</script>

<main class="px-8 py-2">
    {#if $query.data == null}
        Loading...
    {:else}
        {JSON.stringify($query.data)}
    {/if}
</main>
