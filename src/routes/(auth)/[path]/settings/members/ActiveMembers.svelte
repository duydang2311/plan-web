<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/state';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { DateTime } from 'luxon';
    import { toStore } from 'svelte/store';
    import { Pagination, Row, Table, Th, THead } from '~/lib/components';
    import ThSort2 from '~/lib/components/ThSort2.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { createSort, sortHelper } from '~/lib/utils/table.svelte';
    import type { PageData } from './$types';
    import type { LocalWorkspaceMember } from './+page.server';
    import DeleteMemberButton from './DeleteMemberButton.svelte';
    import { workspaceMembersParams } from './utils';

    const { data }: { data: PageData } = $props();
    const { api } = useRuntime();
    const sort = createSort({
        fields: page.url.searchParams.get('order') ?? undefined,
        onDirectionChange: browser ? sortHelper.replaceState(page.url) : undefined
    });
    const params = $derived(
        workspaceMembersParams({
            url: page.url,
            order: sort.string
        })
    );
    const queryKey = $derived([
        'workspace-members',
        { tag: 'active', workspaceId: data.workspace.id, params }
    ]);
    const query = createQuery(
        toStore(() => ({
            queryKey,
            queryFn: async () => {
                const response = await api.get(`workspaces/${data.workspace.id}/members`, {
                    query: params
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
                {#each $query.data.items as { id, user, role, createdTime, updatedTime } (id)}
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
                            <DeleteMemberButton {id} {queryKey} />
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    {#if $query.data}
        <Pagination query={params} list={$query.data}>
            {#snippet label({ from, to, totalCount })}
                Displaying {from} - {to} out of {totalCount} members.
            {/snippet}
        </Pagination>
    {/if}
</div>
