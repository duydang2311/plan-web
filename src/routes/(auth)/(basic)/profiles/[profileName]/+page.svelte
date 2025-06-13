<script lang="ts">
    import { Avatar } from '~/lib/components';
    import LandingLayout from '~/lib/components/layouts/LandingLayout.svelte';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { PageProps } from './$types';
    import CreateProfileView from './CreateProfileView.svelte';
    import ProfileView from './ProfileView.svelte';

    const { data }: PageProps = $props();
    const userRef = createRef.maybePromise(() => data.user);
</script>

<LandingLayout>
    {#snippet topRight()}
        {#if data.localUser}
            <a href="/profiles/me" aria-label="Go to your profile" class="flex items-center">
                <Avatar user={data.localUser} size={64} class="size-avatar-md" />
            </a>
        {/if}
    {/snippet}
    <main class="grow content-center mx-auto p-4">
        {#if userRef.isInitialLoading}
            Loading...
        {:else if userRef.value == null}
            No user found.
        {:else if userRef.value.profile == null}
            <CreateProfileView userId={userRef.value.id} />
        {:else}
            <ProfileView profile={userRef.value.profile} />
        {/if}
    </main>
</LandingLayout>
