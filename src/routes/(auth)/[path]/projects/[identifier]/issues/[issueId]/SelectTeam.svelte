<script lang="ts">
    import { page } from '$app/state';
    import { IconButton, Label } from '~/lib/components';
    import { IconSettingsOutline } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import SelectTeamOptions from './SelectTeamOptions.svelte';
    import { createAssignedTeamListQuery } from './utils.client';

    interface Props {
        workspaceId: string;
        issueId: string;
        canAssign: boolean;
    }

    const { workspaceId, issueId, canAssign }: Props = $props();
    const assignedTeamListQuery = createAssignedTeamListQuery(() => ({ issueId }));
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
    <div class="mb-2 flex items-center gap-2">
        <Label for={popover.trigger.id}>Teams</Label>
        {#if $assignedTeamListQuery.data && $assignedTeamListQuery.data.items.length > 0}
            <span class="bg-base-3 text-base-fg-3 rounded-full px-2 font-medium">
                {$assignedTeamListQuery.data.items.length}
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
    {#if popover.open}
        <Popover {...popover.content} class="w-80 min-w-fit">
            <SelectTeamOptions {workspaceId} {issueId} />
        </Popover>
    {/if}
    {#if $assignedTeamListQuery.isPending}
        <span class="c-text-secondary">Loading...</span>
    {:else if $assignedTeamListQuery.error}
        <span class="c-text-secondary">Something went wrong while retrieving assignees.</span>
    {:else if $assignedTeamListQuery.data == null || $assignedTeamListQuery.data.items.length === 0}
        <span class="c-text-secondary">No teams.</span>
    {:else}
        <ul class="flex flex-wrap gap-4 space-y-1">
            {#each $assignedTeamListQuery.data.items as { team } (team.id)}
                <li>
                    <a href="/{page.params.path}/teams/{team.identifier}">
                        <span class="font-bold">
                            {team.name}
                        </span>
                        <span class="text-base-fg-5 text-xs">
                            {team.identifier}
                        </span>
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>
