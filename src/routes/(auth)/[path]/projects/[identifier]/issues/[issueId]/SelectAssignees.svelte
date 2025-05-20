<script lang="ts">
    import { Avatar, IconButton, Label, OptionalLink } from '~/lib/components';
    import { IconSettingsOutline } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import SelectAssigneesOptions from './SelectAssigneesOptions.svelte';
    import { createAssigneeListQuery } from './utils.client';

    interface Props {
        workspaceId: string;
        issueId: string;
        canAssign: boolean;
    }

    const { workspaceId, issueId, canAssign }: Props = $props();
    const assigneeListQuery = createAssigneeListQuery(() => ({ issueId }));
    const popover = new Popover.Builder({
        forceVisible: true,
        floatingConfig: {
            computePosition: {
                placement: 'bottom-end'
            }
        }
    });
</script>

<div>
    <div class="mb-2">
        {#if canAssign}
            <div class="flex items-center gap-2">
                <Label for={popover.trigger.id}>Assignees</Label>
                {#if $assigneeListQuery.data && $assigneeListQuery.data.items.length > 0}
                    <span class="bg-base-3 text-base-fg-3 rounded-full px-2 font-medium">
                        {$assigneeListQuery.data.items.length}
                    </span>
                {/if}
                {#if canAssign}
                    <IconButton
                        {...popover.trigger}
                        data-custom-state={popover.open ? 'open' : undefined}
                        variant="base"
                        class="ml-auto"
                    >
                        <IconSettingsOutline />
                    </IconButton>
                {/if}
            </div>
        {:else}
            <div class="flex items-center gap-2">
                <p class="c-label">Assignees</p>
                {#if $assigneeListQuery.data && $assigneeListQuery.data.items.length > 0}
                    <span class="bg-base-3 text-base-fg-3 rounded-full px-2 font-medium">
                        {$assigneeListQuery.data && $assigneeListQuery.data.items.length}
                    </span>
                {/if}
            </div>
        {/if}
    </div>
    {#if popover.open}
        <Popover {...popover.content} class="w-80 min-w-fit">
            <SelectAssigneesOptions {workspaceId} {issueId} />
        </Popover>
    {/if}
    {#if $assigneeListQuery.isPending}
        <span class="c-text-secondary">Loading...</span>
    {:else if $assigneeListQuery.error}
        <span class="c-text-secondary">Something went wrong while retrieving assignees.</span>
    {:else if $assigneeListQuery.data == null || $assigneeListQuery.data.items.length === 0}
        <span class="c-text-secondary">No assignees.</span>
    {:else}
        <ul class="space-y-2">
            {#each $assigneeListQuery.data.items as { user } (user.id)}
                {@const displayName = user.profile?.displayName ?? user.profile?.name ?? user.email}
                <li>
                    <OptionalLink
                        href={user.profile ? `/profiles/${user.profile.name}` : undefined}
                    >
                        <div class="flex items-center gap-2">
                            <Avatar
                                {user}
                                size={64}
                                alt="User {displayName}"
                                class="size-avatar-sm"
                            />
                            <div class="ellipsis font-bold">
                                {displayName}
                            </div>
                        </div>
                    </OptionalLink>
                </li>
            {/each}
        </ul>
    {/if}
</div>
