<script lang="ts">
    import { page } from '$app/stores';
    import { pipe } from '@baetheus/fun/fn';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { DateTime } from 'luxon';
    import { Link, Pagination, Row, Table, Th, THead } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { TE } from '~/lib/utils/functional';
    import type { PageData } from './$types';
    import type { LocalProject } from './+page.server';
    import DeleteButton from './DeleteButton.svelte';
    import { paginatedQuery } from '~/lib/utils/url';
    import { mapMaybePromise } from '~/lib/utils/promise';
    import { createEffect } from '~/lib/utils/runes.svelte';

    const { data }: { data: PageData } = $props();
    const queryClient = useQueryClient();
    const { httpClient } = useRuntime();
    const queryKey = ['projects'];
    const query = createQuery({
        queryKey,
        queryFn: () => {
            return pipe(
                TE.fromPromise(() =>
                    httpClient.get(`/api/workspaces/${data.workspace.id}/projects`, {
                        query: {
                            ...data.query,
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
                mapMaybePromise(data.projects, (a) => queryClient.setQueryData(queryKey, a));
            }
        },
        () => data.projects
    );
</script>

<main class="h-full flex flex-col justify-between overflow-auto">
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
                    <td style="grid-column: 1 / -1;">
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
                                href="/{$page.params['path']}/projects/{identifier}/issues"
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
