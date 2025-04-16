<script lang="ts">
    import { pipe } from '@baetheus/fun/fn';
    import { createQuery } from '@tanstack/svelte-query';
    import type { Select } from 'melt/builders';
    import {
        IconBacklog,
        IconCanceled,
        IconCheck,
        IconDone,
        IconDuplicated,
        IconInProgress,
        IconTodo
    } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList, paginatedList } from '~/lib/models/paginatedList';
    import { type WorkspaceStatus } from '~/lib/models/status';
    import { TE } from '~/lib/utils/functional';
    import { select, tsap } from '~/lib/utils/transition';

    interface Item {
        label: string;
        value: Pick<WorkspaceStatus, 'id' | 'value' | 'icon'>;
    }

    const {
        workspaceId,
        builder
    }: {
        workspaceId: string;
        builder: Select<string>;
    } = $props();
    const { api } = useRuntime();

    const query = createQuery({
        queryKey: ['workspace-statuses', { workspaceId }],
        queryFn: () => {
            return pipe(
                TE.fromPromise(() =>
                    api.get(`workspaces/${workspaceId}/statuses`, {
                        query: { select: 'Id,Rank,Value,Icon', order: 'Rank' }
                    })
                )(),
                TE.flatMap((r) =>
                    r.ok
                        ? TE.fromPromise(() => r.json<PaginatedList<WorkspaceStatus>>())()
                        : TE.leftVoid
                ),
                TE.match(
                    () => paginatedList<WorkspaceStatus>(),
                    (r) => r
                )
            )();
        }
    });
    const options = $derived(
        $query.data
            ? paginatedList<Item>({
                  items: $query.data.items.map((a) => ({ label: a.value, value: a })),
                  totalCount: $query.data.totalCount
              })
            : null
    );
    const statusIcons = {
        backlog: IconBacklog,
        todo: IconTodo,
        'in-progress': IconInProgress,
        done: IconDone,
        canceled: IconCanceled,
        duplicated: IconDuplicated
    };
</script>

<div class="c-select--menu" in:tsap={select.in} out:tsap={select.out} {...builder.content}>
    {#if $query.isFetching}
        <li class="c-select--option text-base-fg-ghost">Loading...</li>
    {:else if options && options.items.length > 0}
        {#each options.items as item (item.value.id)}
            {@const StatusIcon =
                item.value.icon && item.value.icon in statusIcons
                    ? statusIcons[item.value.icon as keyof typeof statusIcons]
                    : undefined}
            <li class="c-select--option" {...builder.getOption(item.value.id + '')}>
                {#if builder.isSelected(item.value.id + '')}
                    <IconCheck class="c-select--check" />
                {/if}
                {#if StatusIcon}
                    <StatusIcon />
                {/if}
                {item.label}
            </li>
        {/each}
    {:else}
        <li class="c-select--option text-base-fg-ghost">No statuses yet.</li>
    {/if}
</div>
