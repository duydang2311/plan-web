<script lang="ts">
    import { createMutation, createQuery } from '@tanstack/svelte-query';
    import { SvelteSet } from 'svelte/reactivity';
    import { toStore } from 'svelte/store';
    import Select from '~/lib/components/select';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { QueryResponse } from '~/lib/utils/query';
    import {
        createAssignedTeamListQuery,
        createAssignedTeamListQueryKey,
        type LocalTeam,
        type LocalTeamIssue
    } from './utils.client';

    interface Props {
        workspaceId: string;
        issueId: string;
    }

    const { workspaceId, issueId }: Props = $props();
    const { api, queryClient } = useRuntime();
    const teamListQueryKey = $derived(['teams', { tag: 'issue-details', workspaceId }]);
    const teamListQuery = createQuery(
        toStore(() => ({
            queryKey: teamListQueryKey,
            queryFn: async () => {
                const response = await QueryResponse.HTTP(() =>
                    api.get(`teams`, {
                        query: {
                            workspaceId,
                            select: 'CreatedTime,Id,Name,Identifier',
                            order: '-CreatedTime'
                        }
                    })
                );
                return await QueryResponse.JSON(() => response.json<PaginatedList<LocalTeam>>());
            }
        }))
    );

    const assignedTeamListQueryKey = $derived(createAssignedTeamListQueryKey({ issueId }));
    const addMutation = createMutation({
        mutationFn: ({ issueId, team }: { issueId: string; team: LocalTeam }) =>
            api.post(`team-issues`, {
                body: {
                    issueId: issueId,
                    teamId: team.id
                }
            }),
        onMutate: async ({ team }) => {
            await queryClient.cancelQueries({ queryKey: assignedTeamListQueryKey });
            const old =
                queryClient.getQueryData<PaginatedList<LocalTeamIssue>>(assignedTeamListQueryKey);
            queryClient.setQueryData(
                assignedTeamListQueryKey,
                paginatedList({
                    items: [
                        ...(old?.items ?? []),
                        {
                            team: {
                                id: team.id,
                                name: team.name ?? 'N/A',
                                identifier: team.identifier
                            }
                        }
                    ],
                    totalCount: (old?.totalCount ?? 0) + 1
                })
            );
            return { old };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || (data != null && !data.ok)) {
                if (context) {
                    queryClient.setQueryData(assignedTeamListQueryKey, context.old);
                }
            }
            await queryClient.invalidateQueries({ queryKey: assignedTeamListQueryKey });
        }
    });
    const deleteMutation = createMutation({
        mutationFn: ({ teamId, issueId }: { teamId: string; issueId: string }) =>
            api.delete(`team-issues/${teamId}/${issueId}`),
        onMutate: async ({ teamId }) => {
            await queryClient.cancelQueries({ queryKey: assignedTeamListQueryKey });
            const old =
                queryClient.getQueryData<PaginatedList<LocalTeamIssue>>(assignedTeamListQueryKey);
            queryClient.setQueryData(
                assignedTeamListQueryKey,
                paginatedList({
                    items: old?.items.filter((a) => a.team.id !== teamId) ?? [],
                    totalCount: (old?.totalCount ?? 0) - 1
                })
            );
            return { old };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || (data != null && !data.ok)) {
                if (context) {
                    queryClient.setQueryData(assignedTeamListQueryKey, context.old);
                }
            }
            await queryClient.invalidateQueries({ queryKey: assignedTeamListQueryKey });
        }
    });

    const assignedTeamListQuery = createAssignedTeamListQuery(() => ({ issueId }));
    const value = new SvelteSet<string>($assignedTeamListQuery.data?.items.map((a) => a.team.id));
    const select = new Select.Builder({
        multiple: true,
        forceVisible: true,
        floatingConfig: {
            computePosition: {
                placement: 'bottom'
            }
        },
        value: () => value.values(),
        onValueChange: (next) => {
            for (const a of next.values()) {
                if (value.has(a)) {
                    continue;
                }
                value.add(a);
                const team = queryClient
                    .getQueryData<PaginatedList<LocalTeam>>(teamListQueryKey)
                    ?.items.find((b) => b.id === a);
                if (team) {
                    $addMutation.mutate({
                        issueId,
                        team
                    });
                }
            }

            for (const a of value.values()) {
                if (next.has(a)) {
                    continue;
                }
                value.delete(a);
                $deleteMutation.mutate({
                    issueId,
                    teamId: a
                });
            }
        }
    });
</script>

<div>
    {#if $teamListQuery.isPending}
        <ul class="space-y-1">
            {#each { length: 3 } as _}
                <li class="c-select--option bg-base-4 h-7 w-full animate-pulse"></li>
            {/each}
        </ul>
    {:else if $teamListQuery.error}
        <span class="c-text-secondary">Something went wrong while retrieving teams.</span>
    {:else if $teamListQuery.data == null || $teamListQuery.data.items.length === 0}
        <span class="c-text-secondary px-2">No teams found.</span>
    {:else}
        <ul class="grid grid-cols-[auto_1fr] gap-1">
            {#each $teamListQuery.data.items as team (team.id)}
                <li
                    class="c-select--option col-span-full grid grid-cols-subgrid items-center"
                    {...select.getOption(team.id)}
                >
                    {#if select.isSelected(team.id)}
                        <Select.Check />
                    {/if}
                    <span class="text-base-fg-5 text-xs">{team.identifier}</span>
                    <span>{team.name}</span>
                </li>
            {/each}
        </ul>
    {/if}
</div>
