<script lang="ts">
    import { Link } from '~/lib/components';
    import type { PageData } from './$types';
    import TeamInvitations from './TeamInvitations.svelte';
    import WorkspaceList from './WorkspaceList.svelte';

    const { data }: { data: Required<PageData> } = $props();
</script>

<main class="space-y-8 p-4">
    <section>
        {#if data.user.profile}
            <h1 class="text-p text-base-fg-2">Welcome back, {data.user.profile.displayName}!</h1>
        {:else}
            <h1>Home</h1>
            <p>
                It seems like you don't have a profile yet! To personalize your experience, you can
                start <Link href="/profiles/me">setting it up</Link>.
            </p>
        {/if}
    </section>
    <TeamInvitations {data} />
    <section>
        <div class="mb-4">
            <h2>Your workspaces</h2>
            <p class="text-sm text-base-fg-5">
                Workspace is a place to organize all your projects, teams, and issues. Start
                selecting any workspace to navigate to the dashboard view.
            </p>
        </div>
        <WorkspaceList userId={data.user.id} />
    </section>
</main>
