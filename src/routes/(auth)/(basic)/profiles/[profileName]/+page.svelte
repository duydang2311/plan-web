<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import type { PageData } from './$types';
    import { page } from '$app/stores';
    import CreateProfileView from './CreateProfileView.svelte';
    import { invalidate } from '$app/navigation';

    const { data }: { data: PageData } = $props();
    const queryKey = ['profiles', { profileName: $page.params['profileName'] }];
    const query = createQuery({
        queryKey,
        queryFn: async () => {
            await invalidate('fetch:profiles');
            return await data.profile;
        }
    });
</script>

{#if $query.data == null}
    Loading...
{:else if !('profile' in $query.data) || $query.data.profile == null}
    <CreateProfileView userId={$query.data.id} />
{:else}
    {JSON.stringify($query.data)}
{/if}
