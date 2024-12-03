<script lang="ts">
    import { page } from '$app/stores';
    import { pipe } from '@baetheus/fun/fn';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { DateTime } from 'luxon';
    import { Link, Pagination, Row, Table, Th, THead, Button, Input, Icon } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { TE } from '~/lib/utils/functional';
    import type { PageData } from './$types';
    import type { LocalProject } from './+page.server';
    import DeleteButton from './DeleteButton.svelte';
    import { paginatedQuery } from '~/lib/utils/url';
    import { unwrapMaybePromise } from '~/lib/utils/promise';
    import { createEffect } from '~/lib/utils/runes.svelte';

    const { data }: { data: PageData } = $props();
    const queryClient = useQueryClient();
    const { api } = useRuntime();
    const queryKey = ['projects'];
    const query = createQuery({
        queryKey,
        queryFn: () => {
            return pipe(
                TE.fromPromise(() =>
                    api.get(`projects`, {
                        query: {
                            ...data.query,
                            workspaceId: data.workspace.id,
                            select: 'Id,Name,Identifier,CreatedTime,UpdatedTime'
                        }
                    })
                )(),
                TE.flatMap((a) =>
                    a.ok
                        ? TE.fromPromise(() => a.json<PaginatedList<LocalProject>>())()
                        : TE.fail(a)
                ),
                TE.match(
                    () => paginatedList<LocalProject>(),
                    (r) => r
                )
            )();
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
            href="/{$page.params['path']}/projects/new"
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
                            <Link
                                href="/{$page.params['path']}/issues?project={identifier}"
                                title={name}
                            >
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
