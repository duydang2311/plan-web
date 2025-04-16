<script lang="ts">
    import { pipe } from '@baetheus/fun/fn';
    import { createQuery } from '@tanstack/svelte-query';
    import type { Combobox } from 'melt/builders';
    import { toStore } from 'svelte/store';
    import { IconCheck } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { Team } from '~/lib/models/team';
    import { TE } from '~/lib/utils/functional';
    import { select, tsap } from '~/lib/utils/transition';

    interface Props {
        workspaceId: string;
        builder: Combobox<string, true>;
    }

    const { workspaceId, builder }: Props = $props();
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
    class="c-select--menu min-w-52 space-y-1"
    in:tsap={select.in}
    out:tsap={select.out}
    {...builder.content}
>
    {#if options}
        {#if options.length === 0}
            <li class="c-select--option text-base-fg-ghost px-2">No teams available</li>
        {:else}
            {#each options as item (item.value)}
                <li class="c-select--option" {...builder.getOption(item.value)}>
                    {#if builder.isSelected(item.value)}
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
