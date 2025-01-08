<script lang="ts">
    import { page } from '$app/state';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { DateTime } from 'luxon';
    import { Button, Icon, Input, Link, Pagination, Row, Table, Th, THead } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { unwrapMaybePromise } from '~/lib/utils/promise';
    import { QueryResponse } from '~/lib/utils/query';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import { paginatedQuery } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import type { LocalProject } from './+page.server';
    import DeleteButton from './DeleteButton.svelte';

    const { data }: { data: PageData } = $props();
    const queryClient = useQueryClient();
    const { api } = useRuntime();
    const queryKey = ['projects'];
    const query = createQuery({
        queryKey,
        queryFn: async () => {
            const response = await QueryResponse.HTTP(() =>
                api.get(`projects`, {
                    query: {
                        ...data.query,
                        workspaceId: data.workspace.id,
                        select: 'Id,Name,Identifier,CreatedTime,UpdatedTime'
                    }
                })
            );
            return await QueryResponse.JSON(() => response.json<PaginatedList<LocalProject>>());
        }
    });

    createEffect(
        () => {
            if (data.projects !== $query.data) {
                unwrapMaybePromise(data.projects)((a) => queryClient.setQueryData(queryKey, a));
            }
        },
        () => data.projects
    );
</script>

<main class="h-full grid grid-rows-[auto_1fr] content-start overflow-auto">
    <div class="flex justify-between border-b border-b-base-border-2 px-4 py-1">
        <div class="relative">
            <Input
                id="search"
                type="text"
                class="w-48 border-none focus:ring-0 shadow-none pl-8 py-1"
                placeholder="Search by name"
            />
            <Icon
                name="search"
                class="absolute left-0 top-1/2 translate-x-1/2 -translate-y-1/2 text-base-fg-ghost"
            />
        </div>
        <Button
            as="link"
            href="/{page.params['path']}/projects/new"
            variant="primary"
            filled={false}
            size="sm"
            class="w-fit flex gap-2 items-center"
        >
            <Icon name="plus" />
            Create Project
        </Button>
    </div>
    <Table style="grid-template-columns: auto 1fr auto auto max-content;">
        <THead>
            <Row class="py-2">
                <Th name="identifier" sortable>Identifier</Th>
                <Th name="name" sortable>Name</Th>
                <Th name="createdTime" sortable>Created</Th>
                <Th name="updatedTime" sortable>Updated</Th>
                <Th></Th>
            </Row>
        </THead>
        <tbody>
            {#if !$query.data || $query.data.items.length === 0}
                <Row>
                    <td class="col-span-full">
                        <span class="text-base-fg-ghost"><italic>No projects yet.</italic></span>
                    </td>
                </Row>
            {:else}
                {#each $query.data.items as { id, identifier, name, createdTime, updatedTime } (id)}
                    <Row>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis text-base-fg-3"
                            title={identifier}>{identifier}</td
                        >
                        <td class="whitespace-nowrap overflow-hidden text-ellipsis">
                            <Link href="/{page.params['path']}/projects/{identifier}" title={name}>
                                {name}
                            </Link>
                        </td>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={createdTime}
                        >
                            {DateTime.fromISO(createdTime).toLocaleString(DateTime.DATE_MED)}
                        </td>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={updatedTime}
                        >
                            {DateTime.fromISO(updatedTime).toLocaleString(DateTime.DATE_MED)}
                        </td>
                        <td>
                            <div class="flex flex-wrap gap-2">
                                <DeleteButton {queryKey} project={{ id, name }} />
                            </div>
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    {#if $query.data}
        <Pagination query={paginatedQuery(data.query)} list={$query.data}>
            {#snippet label({ from, to, totalCount })}
                Displaying {from} - {to} out of {totalCount} members.
            {/snippet}
        </Pagination>
    {/if}
</main>
