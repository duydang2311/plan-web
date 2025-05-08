<script lang="ts">
    import { page } from '$app/state';
    import { createMutation, createQuery } from '@tanstack/svelte-query';
    import { Combobox } from 'melt/builders';
    import { SvelteSet } from 'svelte/reactivity';
    import { toStore } from 'svelte/store';
    import { Input } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { Team } from '~/lib/models/team';
    import SelectTeamOptions from './SelectTeamOptions.svelte';

    interface Props {
        workspaceId: string;
        issueId: string;
        canAssign: boolean;
    }

    type LocalSelectTeam = Pick<Team, 'id' | 'name' | 'identifier'>;

    const { workspaceId, issueId, canAssign }: Props = $props();
    const { api, queryClient } = useRuntime();
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

    const value = new SvelteSet<string>($selectedQuery.data?.map((a) => a.id));
    const builder = new Combobox({
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
                    .getQueryData<
                        PaginatedList<LocalSelectTeam>
                    >(['teams', { tag: 'issue-details', workspaceId }])
                    ?.items.find((b) => b.id === a);
                if (team) {
                    $addMutation.mutate({
                        issueId,
                        teamName: team.name,
                        teamId: team.id
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
    <div class="mb-2 flex items-center gap-2">
        <h2 class="c-label">Teams</h2>
        {#if value.size > 0}
            <span class="bg-base-3 text-base-fg-3 rounded-full px-2 text-sm font-medium">
                {value.size}
            </span>
        {/if}
    </div>
    {#if canAssign}
    <Input
        type="text"
        size="sm"
        {...builder.input}
        onfocus={(e) => {
            builder.open = true;
            builder.input.onfocus(e);
        }}
    />
    {/if}
    {#if builder.open}
        <SelectTeamOptions {workspaceId} {builder} />
    {/if}
    {#if $selectedQuery.data != null && $selectedQuery.data.length}
        <ul class="mt-2 flex flex-wrap gap-1">
            {#each $selectedQuery.data as team (team.id)}
                {#if team.identifier}
                    <li class="grow">
                        <a
                            href="/{page.params.path}/teams/{team.identifier}"
                            class="bg-base-2 dark:bg-base-3 text-base-fg-2 border-base-border-2 hover:bg-base-4 hover:text-base-fg-1 active:bg-base-active block w-full overflow-hidden text-ellipsis rounded-full border px-2
                            text-center text-sm font-medium"
                        >
                            {team.name}
                        </a>
                    </li>
                {:else}
                    <li
                        class="bg-base-2 dark:bg-base-3 text-base-fg-1 border-base-border-2 grow overflow-hidden text-ellipsis rounded-full border px-2 text-center text-sm font-medium"
                    >
                        {team.name}
                    </li>
                {/if}
            {/each}
        </ul>
    {/if}
</div>
