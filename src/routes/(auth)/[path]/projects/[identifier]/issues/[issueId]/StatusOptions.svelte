<script lang="ts">
    import { pipe } from '@baetheus/fun/fn';
    import type { SelectOption } from '@melt-ui/svelte';
    import { melt } from '@melt-ui/svelte';
    import { createQuery } from '@tanstack/svelte-query';
    import type { Writable } from 'svelte/store';
    import { Icon } from '~/lib/components';
    import { isIconName } from '~/lib/components/Icon.svelte';
    import type { SelectChildrenProps } from '~/lib/components/SelectBuilder.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList, paginatedList } from '~/lib/models/paginatedList';
    import { type WorkspaceStatus } from '~/lib/models/status';
    import { TE } from '~/lib/utils/functional';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import { select, tsap } from '~/lib/utils/transition';

    interface Item {
        label: string;
        value: Pick<WorkspaceStatus, 'id' | 'value' | 'icon'>;
    }

    const {
        selected,
        workspaceId,
        selectProps
    }: {
        selected: Writable<SelectOption<Pick<WorkspaceStatus, 'id' | 'value' | 'icon'>>>;
        workspaceId: string;
        selectProps: Pick<SelectChildrenProps, 'menu' | 'option' | 'helpers'>;
    } = $props();
    const {
        menu,
        option,
        helpers: { isSelected }
    } = $derived(selectProps);
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
    createEffect(
        () => {
            if (!options) return;
            $selected = options.items.find((a) => a.value.id == $selected?.value.id)!;
        },
        () => options
    );
</script>

<div class="c-select--menu" use:melt={menu} in:tsap={select.in} out:tsap={select.out}>
    {#if $query.isFetching}
        <li class="c-select--option text-base-fg-ghost">Loading...</li>
    {:else if options && options.items.length > 0}
        {#each options.items as item (item.value.id)}
            {@const opt = option(item)}
            {@const selected = isSelected(item.value)}
            <li use:melt={opt} class="c-select--option">
                {#if selected}
                    <Icon name="check" class="c-select--check" />
                {/if}
                {#if item.value.icon && isIconName(item.value.icon)}
                    <Icon name={item.value.icon} />
                {/if}
                {item.label}
            </li>
        {/each}
    {:else}
        <li class="c-select--option text-base-fg-ghost">No statuses yet.</li>
    {/if}
</div>
