<script lang="ts">
    import { Link } from '~/lib/components';
    import TeamInvitations from './TeamInvitations.svelte';
    import WorkspaceList from './WorkspaceList.svelte';
    import { createUserQuery } from './utils';

    const { userId }: { userId: string } = $props();
    const query = createUserQuery(() => ({ userId }));
</script>

<main class="space-y-8 p-4">
    <section>
        {#if $query.isPending}
            <p class="c-label">Loading...</p>
        {:else if $query.error || $query.data.profile == null}
            <h1>Home</h1>
            {#if $query.error}
                <p class="c-label">
                    An unknown error occurred while we were retrieving your information.
                </p>
            {:else}
                <p>
                    It seems like you don't have a profile yet! To personalize your experience, you
                    can start <Link href="/profiles/me">setting it up</Link>.
                </p>
            {/if}
        {:else}
            <h1>Welcome back, {$query.data.profile.displayName}!</h1>
        {/if}
    </section>
    <TeamInvitations {userId} />
    <section>
        <div class="mb-4">
            <h2>Your workspaces</h2>
            <p class="c-label">
                Workspace is where you organize projects, teams, and issues. Start by clicking on a
                workspace to manage them or creating a new one.
            </p>
        </div>
        <WorkspaceList {userId} />
    </section>
</main>
