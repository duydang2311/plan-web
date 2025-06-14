<script lang="ts">
    import { Avatar } from '~/lib/components';
    import LandingLayout from '~/lib/components/layouts/LandingLayout.svelte';
    import { createRef } from '~/lib/utils/runes.svelte';
    import NotificationBell from '~/routes/(auth)/[path]/NotificationBell.svelte';
    import type { PageProps } from './$types';
    import CreateProfileView from './CreateProfileView.svelte';
    import ProfileView from './ProfileView.svelte';

    const { data }: PageProps = $props();
    const userRef = createRef.maybePromise(() => data.user);
</script>

<LandingLayout>
    {#snippet topRight()}
        <div class="flex items-center gap-4">
            <NotificationBell userId={data.localUser.id} />
            <a href="/profiles/me" aria-label="Go to your profile" class="flex items-center">
                <Avatar user={data.localUser} size={64} class="size-avatar-md" />
            </a>
        </div>
    {/snippet}
    <main class="mx-auto grow content-center p-4">
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
