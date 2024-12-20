<script lang="ts">
    import { page } from '$app/state';
    import { type SelectOption } from '@melt-ui/svelte';
    import { createMutation, createQuery } from '@tanstack/svelte-query';
    import { toStore, writable } from 'svelte/store';
    import { Button, Icon, SelectBuilder } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { Team } from '~/lib/models/team';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import SelectTeamOptions from './SelectTeamOptions.svelte';

    interface Props {
        workspaceId: string;
        issueId: string;
    }

    type LocalSelectTeam = Pick<Team, 'id' | 'name' | 'identifier'>;

    const { workspaceId, issueId }: Props = $props();
    const { api, queryClient } = useRuntime();
    const open = writable(false);
    const selectedQueryKey = $derived(['issues', { issueId, tag: 'select-team' }]);
    const selectedQuery = createQuery(
        toStore(() => ({
            queryKey: selectedQueryKey,
            queryFn: async () => {
                const response = await api.get(`issues/${issueId}`, {
                    query: { select: 'Teams.Id,Teams.Name,Teams.Identifier' }
                });
                if (!response.ok) {
                    return null;
                }
                return await response.json<{ teams: LocalSelectTeam[] }>().then((a) => a.teams);
            }
        }))
    );
    const selected = writable<(SelectOption<string> & { identifier?: string })[]>(
        $selectedQuery.data?.map((a) => ({
            label: a.name,
            value: a.id,
            identifier: a.identifier
        })) ?? []
    );
    const addMutation = createMutation({
        mutationFn: (variables: { teamId: string; issueId: string; teamName?: string }) =>
            api.post(`team-issues`, { body: variables }),
        onMutate: async ({ teamId, teamName }) => {
            await queryClient.cancelQueries({ queryKey: selectedQueryKey });
            const old = queryClient.getQueryData<LocalSelectTeam[]>(selectedQueryKey);
            queryClient.setQueryData(selectedQueryKey, [
                ...(old ?? []),
                {
                    id: teamId,
                    name: teamName ?? 'N/A'
                }
            ]);
            return { old };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || (data != null && !data.ok)) {
                if (context) {
                    queryClient.setQueryData(selectedQueryKey, context.old);
                }
            }
            await queryClient.invalidateQueries({ queryKey: selectedQueryKey });
        }
    });
    const deleteMutation = createMutation({
        mutationFn: ({ teamId, issueId }: { teamId: string; issueId: string }) =>
            api.delete(`team-issues/${teamId}/${issueId}`),
        onMutate: async ({ teamId }) => {
            await queryClient.cancelQueries({ queryKey: selectedQueryKey });
            const old = queryClient.getQueryData<LocalSelectTeam[]>(selectedQueryKey);
            queryClient.setQueryData(
                selectedQueryKey,
                old?.filter((a) => a.id !== teamId)
            );
            return { old };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || (data != null && !data.ok)) {
                if (context) {
                    queryClient.setQueryData(selectedQueryKey, context.old);
                }
            }
            await queryClient.invalidateQueries({ queryKey: selectedQueryKey });
        }
    });

    createEffect(
        () => {
            if ($selectedQuery.data) {
                $selected = $selectedQuery.data.map((a) => ({
                    label: a.name,
                    value: a.id,
                    identifier: a.identifier
                }));
            }
        },
        () => $selectedQuery
    );
</script>

<div>
    <div class="flex items-center gap-2 mb-2">
        <h2 class="c-label">Teams</h2>
        {#if $selected.length > 0}
            <span class="text-sm font-medium px-2 rounded-full bg-base-3 text-base-fg-3">
                {$selected.length}
            </span>
        {/if}
    </div>
    {#if $selected.length}
        <ul class="flex gap-1 flex-wrap mb-3">
            {#each $selected as option (option.value)}
                {#if option.identifier}
                    <li class="grow">
                        <a
                            href="/{page.params.path}/teams/{option.identifier}"
                            class="block w-full text-center rounded-full bg-base-2 dark:bg-base-3 text-base-fg-2 border border-base-border-2 px-2 text-ellipsis overflow-hidden text-sm font-medium
                            hover:bg-base-4 hover:text-base-fg-1 active:bg-base-active"
                        >
                            {option.label}
                        </a>
                    </li>
                {:else}
                    <li
                        class="grow text-center rounded-full bg-base-2 dark:bg-base-3 text-base-fg-1 border border-base-border-2 px-2 text-ellipsis overflow-hidden text-sm font-medium"
                    >
                        {option.label}
                    </li>
                {/if}
            {/each}
        </ul>
    {/if}
    <SelectBuilder
        options={{
            multiple: true,
            forceVisible: true,
            selected,
            open,
            positioning: {
                sameWidth: false,
                placement: 'left-start'
            },
            onSelectedChange: ({ curr, next }) => {
                const added =
                    curr == null
                        ? next
                        : next?.filter((a) => curr.every((b) => b.value !== a.value));
                const removed =
                    next == null
                        ? curr
                        : curr?.filter((a) => next.every((b) => b.value !== a.value));
                if (added) {
                    for (const a of added) {
                        $addMutation.mutate({
                            issueId,
                            teamName: a.label,
                            teamId: a.value
                        });
                    }
                }
                if (removed) {
                    for (const a of removed) {
                        $deleteMutation.mutate({
                            issueId,
                            teamId: a.value
                        });
                    }
                }
                return curr;
            }
        }}
    >
        {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
            <Button
                type="button"
                variant="base"
                size="sm"
                melt={trigger}
                class="flex items-center gap-2"
            >
                <Icon name="plus" />
                Add team
            </Button>
            {#if $open}
                <SelectTeamOptions
                    {workspaceId}
                    builders={{ menu, option }}
                    helpers={{ isSelected }}
                />
            {/if}
        {/snippet}
    </SelectBuilder>
</div>
