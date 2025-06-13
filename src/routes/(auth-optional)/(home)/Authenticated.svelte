<script lang="ts">
    import { Avatar } from '~/lib/components';
    import LandingLayout from '~/lib/components/layouts/LandingLayout.svelte';
    import TeamInvitations from './TeamInvitations.svelte';
    import WorkspaceList from './WorkspaceList.svelte';
    import { createUserQuery } from './utils';

    const { userId }: { userId: string } = $props();
    const query = createUserQuery(() => ({ userId }));
</script>

<LandingLayout>
    {#snippet topRight()}
        {#if $query.data}
            <a href="/profiles/me" aria-label="Go to your profile" class="flex items-center">
                <Avatar user={$query.data} size={64} class="size-avatar-md" />
            </a>
        {/if}
    {/snippet}
    <main class="container mx-auto p-4">
        <TeamInvitations {userId} />
        <section>
            <h1 class="font-h-bold capitalize">Your workspaces</h1>
            <div class="mb-4">
                <p class="c-text-secondary">
                    Workspace is where you organize projects, teams, and issues. Start by clicking
                    on a workspace to manage them or creating a new one.
                </p>
            </div>
            <WorkspaceList {userId} />
        </section>
    </main>
</LandingLayout>
