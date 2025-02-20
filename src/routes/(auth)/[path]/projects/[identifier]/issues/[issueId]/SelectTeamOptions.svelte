<script lang="ts">
    import { pipe } from '@baetheus/fun/fn';
    import { melt } from '@melt-ui/svelte';
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { IconCheck } from '~/lib/components/icons';
    import type { SelectChildrenProps } from '~/lib/components/SelectBuilder.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { Team } from '~/lib/models/team';
    import { TE } from '~/lib/utils/functional';
    import { select, tsap } from '~/lib/utils/transition';

    interface Props {
        workspaceId: string;
        builders: {
            menu: SelectChildrenProps['menu'];
            option: SelectChildrenProps['option'];
        };
        helpers: {
            isSelected: SelectChildrenProps['helpers']['isSelected'];
        };
    }

    const { workspaceId, builders, helpers }: Props = $props();
    const { menu, option } = $derived(builders);
    const { isSelected } = $derived(helpers);
    const { api } = useRuntime();
    const queryKey = $derived(['teams', { tag: 'issue-details', workspaceId }]);
    const query = createQuery<PaginatedList<Pick<Team, 'id' | 'name'>> | null>(
        toStore(() => ({
            queryKey,
            queryFn: () => {
                return pipe(
                    TE.fromPromise(() =>
                        api.get(`teams`, {
                            query: {
                                workspaceId,
                                select: 'CreatedTime,Id,Name',
                                order: '-CreatedTime'
                            }
                        })
                    )(),
                    TE.flatMap((a) =>
                        a.ok
                            ? TE.fromPromise(() =>
                                  a.json<PaginatedList<Pick<Team, 'id' | 'name'>>>()
                              )()
                            : TE.leftVoid
                    ),
                    TE.match(
                        () => null,
                        (r) => r
                    )
                )();
            }
        }))
    );
    const options = $derived(
        $query.data
            ? $query.data.items.map((a) => ({
                  label: a.name,
                  value: a.id
              }))
            : null
    );
</script>

<ol
    use:melt={menu}
    class="c-select--menu min-w-52 space-y-1"
    in:tsap={select.in}
    out:tsap={select.out}
>
    {#if options}
        {#if options.length === 0}
            <li class="c-select--option text-base-fg-ghost px-2">No teams available</li>
        {:else}
            {#each options as item (item.value)}
                {@const opt = option(item)}
                {@const selected = isSelected(item.value)}
                <li use:melt={opt} class="c-select--option">
                    {#if selected}
                        <IconCheck class="c-select--check" />
                    {/if}
                    {item.label}
                </li>
            {/each}
        {/if}
    {:else}
        {#each { length: 3 } as _}
            <li class="c-select--option bg-base-4 h-7 w-full animate-pulse"></li>
        {/each}
    {/if}
</ol>
