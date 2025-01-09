<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/state';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { DateTime } from 'luxon';
    import { toStore } from 'svelte/store';
    import {
        Button,
        Icon,
        Input,
        Link,
        Pagination,
        Row,
        Table,
        Th,
        THead,
        ThSort2
    } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { QueryResponse } from '~/lib/utils/query';
    import { createSort, sortHelper } from '~/lib/utils/table.svelte';
    import { paginatedQuery } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import type { LocalProject } from './+page.server';
    import DeleteButton from './DeleteButton.svelte';
    import { createProjectListQueryParams } from './utils';

    const { data }: { data: PageData } = $props();
    const { api } = useRuntime();
    const sort = createSort({
        fields: page.url.searchParams.get('order') ?? undefined,
        onDirectionChange: browser ? sortHelper.replaceState(page.url) : undefined
    });
    const queryKey = $derived.by(() => {
        const params = createProjectListQueryParams(() => ({
            url: page.url,
            workspaceId: data.workspace.id,
            order: sort.string
        }));
        return ['projects', params] as const;
    });
    const query = createQuery(
        toStore(() => ({
            queryKey,
            queryFn: async () => {
                const response = await QueryResponse.HTTP(() =>
                    api.get(`projects`, {
                        query: queryKey[1]
                    })
                );
                return await QueryResponse.JSON(() => response.json<PaginatedList<LocalProject>>());
            },
            placeholderData: keepPreviousData
        }))
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
                <ThSort2 field={sort.field('identifier')}>Identifier</ThSort2>
                <ThSort2 field={sort.field('name')}>Name</ThSort2>
                <ThSort2 field={sort.field('createdTime')}>Created</ThSort2>
                <ThSort2 field={sort.field('updatedTime')}>Updated</ThSort2>
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
