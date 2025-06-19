<script lang="ts">
    import { Avatar, Button } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import LandingLayout from '~/lib/components/layouts/LandingLayout.svelte';
    import FriendsButton from '~/routes/(auth)/[path]/FriendsButton.svelte';
    import NotificationBell from '~/routes/(auth)/[path]/NotificationBell.svelte';
    import TeamInvitations from './TeamInvitations.svelte';
    import WorkspaceList from './WorkspaceList.svelte';
    import { createUserQuery } from './utils';

    const { userId }: { userId: string } = $props();
    const query = createUserQuery(() => ({ userId }));
</script>

<LandingLayout>
    {#snippet topRight()}
        <div class="flex items-center gap-4">
            <FriendsButton {userId} />
            <NotificationBell {userId} />
            {#if $query.data}
                <a href="/profiles/me" aria-label="Go to your profile" class="flex items-center">
                    <Avatar user={$query.data} size={64} class="size-avatar-md" />
                </a>
            {/if}
        </div>
    {/snippet}
    <main class="container mx-auto p-4">
        <TeamInvitations {userId} />
        <section>
            <div class="mb-4 flex items-baseline justify-between gap-8">
                <div>
                    <h1 class="font-h-bold capitalize">Your workspaces</h1>
                    <div>
                        <p class="c-text-secondary">
                            Workspace is where you organize projects, teams, and issues. Start by
                            clicking on a workspace to manage them or creating a new one.
                        </p>
                    </div>
                </div>
                <Button
                    as="link"
                    href="/new"
                    variant="primary"
                    class="flex w-fit items-center gap-2 capitalize text-nowrap"
                >
                    <IconPlus />
                    <span>Create workspace</span>
                </Button>
            </div>
            <WorkspaceList {userId} />
        </section>
    </main>
</LandingLayout>
