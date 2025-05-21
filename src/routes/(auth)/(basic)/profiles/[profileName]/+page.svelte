<script lang="ts">
    import { Main } from '~/lib/components';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { PageProps } from './$types';
    import CreateProfileView from './CreateProfileView.svelte';
    import ProfileView from './ProfileView.svelte';

    const { data }: PageProps = $props();
    const userRef = createRef.maybePromise(() => data.user);
</script>

<Main class="h-full flex-1 content-center">
    {#if userRef.isInitialLoading}
        Loading...
    {:else if userRef.value == null}
        No user found.
    {:else if userRef.value.profile == null}
        <CreateProfileView userId={userRef.value.id} />
    {:else}
        <ProfileView profile={userRef.value.profile} />
    {/if}
</Main>
