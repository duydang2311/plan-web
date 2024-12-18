<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/stores';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Icon, IconButton, Pagination, Row, Table, Th, THead } from '~/lib/components';
    import ThSort2 from '~/lib/components/ThSort2.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { createSort, sortHelper } from '~/lib/utils/table.svelte';
    import { queryParams } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import type { LocalWorkspaceMember } from './+page.server';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { DateTime } from 'luxon';

    const { data }: { data: PageData } = $props();
    const { api } = useRuntime();
    const sort = createSort({
        fields: $page.url.searchParams.get('order') ?? undefined,
        onDirectionChange: browser ? sortHelper.replaceState($page.url) : undefined
    });
    const params = $derived({
        ...queryParams($page.url, { page: 1, size: 20 }),
        order: sort.string
    });
    const query = createQuery(
        toStore(() => ({
            queryKey: [
                'workspace-members',
                { tag: 'active', workspaceId: data.workspace.id, params }
            ],
            queryFn: async () => {
                const response = await api.get(`workspaces/${data.workspace.id}/members`, {
                    query: {
                        ...params,
                        select: 'CreatedTime,UpdatedTime,UserId,User.Email,Role.Name'
                    }
                });
                return await response.json<PaginatedList<LocalWorkspaceMember>>();
            },
            placeholderData: keepPreviousData
        }))
    );
</script>

<div class="grid grid-rows-[1fr_auto]">
    <Table class="grid-cols-[1fr_1fr_auto_auto_auto]">
        <THead>
            <Row class="py-2 items-center">
                <Th>Email address</Th>
                <Th>Role</Th>
                <ThSort2 field={sort.field('createdTime')}>Created time</ThSort2>
                <ThSort2 field={sort.field('updatedTime')}>Updated time</ThSort2>
                <Th>Actions</Th>
            </Row>
        </THead>
        <tbody>
            {#if !$query.data || $query.data.items.length === 0}
                <Row>
                    <td class="col-span-full">No members yet.</td>
                </Row>
            {:else}
                {#each $query.data.items as { userId, user, role, createdTime, updatedTime } (userId)}
                    <Row>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={user.email}
                        >
                            {user.email}
                        </td>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={role.name}
                        >
                            {role.name}
                        </td>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={DateTime.fromISO(createdTime).toRelative()}
                        >
                            {DateTime.fromISO(createdTime).toRelative()}
                        </td>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={DateTime.fromISO(updatedTime).toRelative()}
                        >
                            {DateTime.fromISO(updatedTime).toRelative()}
                        </td>
                        <td>
                            <div class="flex flex-wrap gap-2">
                                <IconButton
                                    type="button"
                                    variant="negative"
                                    title="Remove member"
                                    class="w-fit"
                                >
                                    <Icon name="trash" />
                                </IconButton>
                            </div>
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    {#if $query.data}
        <Pagination query={data.query} list={$query.data}>
            {#snippet label({ from, to, totalCount })}
                Displaying {from} - {to} out of {totalCount} members.
            {/snippet}
        </Pagination>
    {/if}
</div>
