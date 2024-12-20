<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/state';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { DateTime } from 'luxon';
    import { toStore } from 'svelte/store';
    import { Icon, IconButton, Pagination, Row, Table, Th, THead } from '~/lib/components';
    import ThSort2 from '~/lib/components/ThSort2.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { createSort, sortHelper } from '~/lib/utils/table.svelte';
    import type { PageData } from './$types';
    import type { LocalWorkspaceInvitation } from './+page.server';
    import { pendingMembersParams } from './utils';

    const { data }: { data: PageData } = $props();
    const { api } = useRuntime();
    const sort = createSort({
        fields: page.url.searchParams.get('order') ?? undefined,
        onDirectionChange: browser ? sortHelper.replaceState(page.url) : undefined
    });
    const params = $derived(
        pendingMembersParams({
            url: page.url,
            workspaceId: data.workspace.id,
            order: sort.string
        })
    );
    const query = createQuery(
        toStore(() => ({
            queryKey: ['workspace-invitations', { tag: 'pending', params }],
            queryFn: async () => {
                const response = await api.get(`workspace-invitations`, {
                    query: params
                });
                return await response.json<PaginatedList<LocalWorkspaceInvitation>>();
            },
            placeholderData: keepPreviousData
        }))
    );
</script>

<div class="grid grid-rows-[1fr_auto]">
    <Table class="grid-cols-[1fr_auto_auto]">
        <THead>
            <Row class="py-2 items-center">
                <Th>User</Th>
                <ThSort2 field={sort.field('createdTime')}>Created time</ThSort2>
                <Th>Actions</Th>
            </Row>
        </THead>
        <tbody>
            {#if !$query.data}
                <Row>
                    <td class="col-span-full text-base-fg-ghost">Loading...</td>
                </Row>
            {:else if $query.data.items.length === 0}
                <Row>
                    <td class="col-span-full text-base-fg-ghost">No invitations available.</td>
                </Row>
            {:else}
                {#each $query.data.items as { id, user, createdTime } (id)}
                    <Row>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={user.email}
                        >
                            {user.email}
                        </td>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={DateTime.fromISO(createdTime).toRelative()}
                        >
                            {DateTime.fromISO(createdTime).toRelative()}
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
        <Pagination query={params} list={$query.data}>
            {#snippet label({ from, to, totalCount })}
                Displaying {from} - {to} out of {totalCount} invitations.
            {/snippet}
        </Pagination>
    {/if}
</div>
