<script lang="ts">
    import type { SelectOption } from '@melt-ui/svelte';
    import { melt } from '@melt-ui/svelte';
    import { createQuery } from '@tanstack/svelte-query';
    import type { Writable } from 'svelte/store';
    import { Icon } from '~/lib/components';
    import { isIconName } from '~/lib/components/Icon.svelte';
    import type { SelectChildrenProps } from '~/lib/components/Select.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { type WorkspaceStatus } from '~/lib/models/status';
    import { tryPromise } from '~/lib/utils/neverthrow';
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
    const { httpClient } = useRuntime();

    const query = createQuery({
        queryKey: ['statuses', { workspaceId }],
        queryFn: async () => {
            const tryGet = await tryPromise(
                httpClient.get(`/api/workspaces/${workspaceId}/statuses`, {
                    query: {
                        select: 'Id, Value, Icon'
                    }
                })
            );

            if (tryGet.isErr() || !tryGet.value.ok) {
                return paginatedList<Item>();
            }

            const tryJson = await tryPromise(
                tryGet.value.json<PaginatedList<Pick<WorkspaceStatus, 'id' | 'value' | 'icon'>>>()
            );

            if (tryJson.isErr()) {
                return paginatedList<Item>();
            }

            const list = paginatedList<Item>({
                items: tryJson.value.items.map((a) => ({ label: a.value, value: a })),
                totalCount: tryJson.value.totalCount
            });
            $selected = list.items.find((a) => a.value.id == $selected?.value.id)!;
            return list;
        }
    });
</script>

<div class="c-select--menu" use:melt={menu} in:tsap={select.in} out:tsap={select.out}>
    {#if $query.isFetching}
        <li class="c-select--option text-base-fg-ghost">Loading...</li>
    {:else if $query.data && $query.data.items.length > 0}
        {#each $query.data.items as item (item.value.id)}
            {@const opt = option(item)}
            {@const selected = isSelected(item.value)}
            <li use:melt={opt} class="c-select--option">
                {#if selected}
                    <Icon
                        name="check"
                        class="absolute left-0 translate-x-1/2 top-1/2 -translate-y-1/2 text-primary-1"
                    />
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
