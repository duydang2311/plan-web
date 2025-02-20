<script lang="ts">
    import { melt } from '@melt-ui/svelte';
    import { createQuery } from '@tanstack/svelte-query';
    import { IconCheck } from '~/lib/components/icons';
    import { type SelectChildrenProps } from '~/lib/components/SelectBuilder.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { Team } from '~/lib/models/team';
    import { select, tsap } from '~/lib/utils/transition';

    const {
        workspaceId,
        select: props
    }: { workspaceId: string; select: Pick<SelectChildrenProps, 'menu' | 'option' | 'helpers'> } =
        $props();

    const { api } = useRuntime();
    const query = createQuery({
        queryKey: ['projects', { workspaceId }],
        queryFn: async () => {
            const response = await api.get(`projects`, {
                query: { workspaceId, select: 'Id,Name' }
            });

            return await response.json<PaginatedList<Team>>();
        }
    });
    const menu = $derived(props.menu);
    const option = $derived(props.option);
    const teams = $derived(
        $query.data != null
            ? $query.data.items.map((a) => ({
                  label: a.name,
                  value: a.id
              }))
            : null
    );
</script>

<ol use:melt={menu} class="c-select--menu" in:tsap={select.in} out:tsap={select.out}>
    {#if $query.isFetching}
        {#each { length: 4 } as _}
            <li class="bg-base-3 h-8 w-full animate-pulse rounded"></li>
        {/each}
    {:else if teams != null}
        {#each teams as team (team.value)}
            {@const opt = option(team)}
            {@const selected = props.helpers.isSelected(team.value)}
            <li use:melt={opt} class="c-select--option">
                <div>
                    {#if selected}
                        <IconCheck class="c-select--check" />
                    {/if}
                    {team.label}
                </div>
            </li>
        {/each}
    {:else}
        <li class="c-select--option text-base-fg-ghost pl-2">Not available</li>
    {/if}
</ol>
