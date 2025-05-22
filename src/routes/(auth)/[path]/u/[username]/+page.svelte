<script lang="ts">
    import { Link, Main } from '~/lib/components';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { PageProps } from './$types';
    import Bio from './Bio.svelte';
    import DisplayName from './DisplayName.svelte';
    import ProfileImage from './ProfileImage.svelte';
    import SocialLinks from './SocialLinks.svelte';

    const { data }: PageProps = $props();
    const getUserRef = createRef.maybePromise(() => data.getUser);
    const isCurrentUser = $derived(
        getUserRef.value != null &&
            getUserRef.value.ok === true &&
            data.user.id === getUserRef.value.data.id
    );
</script>

{#snippet card(title: string, text: string)}
    <div class="border-base-border-3 bg-base-2 dark:bg-base-3 rounded-lg border p-4">
        <p class="text-base-fg-4 capitalize">
            {title}
        </p>
        <p class="text-base-fg-1 text-4xl font-bold">{text}</p>
    </div>
{/snippet}

<Main class="@container p-8">
    {#if getUserRef.isInitialLoading}
        Loading...
    {:else if getUserRef.value.failed}
        Something went wrong while retrieving the user (code: {getUserRef.value.error}).
    {:else}
        {@const user = getUserRef.value.data}
        <div class="@4xl:flex-row mx-auto flex min-h-full flex-col gap-8">
            <div class="@4xl:max-w-paragraph-sm w-full">
                <ProfileImage {user} {isCurrentUser} />
                <div class="@max-4xl:text-center mt-8">
                    {#if user.profile}
                        <DisplayName
                            {isCurrentUser}
                            {getUserRef}
                            userId={user.id}
                            displayName={user.profile?.displayName}
                        />
                        <p class="text-base-fg-4">
                            {user.profile.name}
                            <span class="c-text-secondary"></span>
                            · <Link href="mailto:{user.email}" class="text-base-fg-4 font-normal">
                                {user.email}
                            </Link>
                        </p>
                    {:else}
                        <h1 class="text-p">
                            <Link href="mailto:{user.email}">{user.email}</Link>
                        </h1>
                    {/if}
                </div>
                <Bio {isCurrentUser} {getUserRef} userId={user.id} bio={user.profile?.bio} />
                <SocialLinks
                    {isCurrentUser}
                    {getUserRef}
                    userId={user.id}
                    socialLinks={user.profile?.socialLinks}
                />
            </div>
            <div class="w-full grow">
                <div class="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
                    {@render card('Workspaces', '4')}
                    {@render card('Projects', '12')}
                    {@render card('Teams', '3')}
                    {@render card('Avg. completion', '97%')}
                </div>
            </div>
        </div>
    {/if}
</Main>
