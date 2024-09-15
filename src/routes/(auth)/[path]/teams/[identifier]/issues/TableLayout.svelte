<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { page } from '$app/stores';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    import clsx from 'clsx';
    import { DateTime } from 'luxon';
    import { Link, Pagination, Row, Table, Th, THead } from '~/lib/components';
    import type { PageData } from './$types';
    import { mapMaybePromise } from '~/lib/utils/promise';

    const { data }: { data: PageData } = $props();
    const queryClient = useQueryClient();
    const queryKey = ['issues'];
    const query = createQuery({
        queryKey,
        queryFn: async () => {
            await invalidate('fetch:issues');
            return await data.issueList!;
        }
    });

    $effect(() => {
        mapMaybePromise(data.issueList, (a) => queryClient.setQueryData(queryKey, a));
    });
</script>

<div class="flex flex-col grow justify-between overflow-auto">
    <Table style="grid-template-columns: auto 1fr 1fr auto;">
        <THead>
            <Row class="py-2">
                <Th sortable name="title" style="grid-column: span 2;">Title</Th>
                <Th sortable name="createdTime">Created</Th>
                <Th sortable name="updatedTime">Updated</Th>
            </Row>
        </THead>
        <tbody class={clsx($query.isFetching && 'animate-twPulse')}>
            {#if !$query.data}
                <Row>
                    <td style="grid-column: 1 / -1;">Loading issues...</td>
                </Row>
            {:else if $query.data.items.length === 0}
                <Row>
                    <td style="grid-column: 1 / -1;">No issues yet.</td>
                </Row>
            {:else}
                {#each $query.data.items as { id, createdTime, updatedTime, orderNumber, title }}
                    <Row>
                        <td>
                            <div
                                class="min-w-max block text-sm font-bold text-base-fg-3/60 content-center"
                            >
                                {data.team.identifier}-{orderNumber}
                            </div>
                        </td>
                        <td>
                            <Link href="/{$page.params['path']}/issues/{id}">{title}</Link>
                        </td>
                        <td>
                            {DateTime.fromISO(createdTime).toLocaleString(DateTime.DATETIME_SHORT)}
                        </td>
                        <td>
                            {DateTime.fromISO(updatedTime).toLocaleString(DateTime.DATETIME_SHORT)}
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    {#if $query.data && data.query}
        <Pagination query={data.query} list={$query.data}>
            {#snippet label({ from, to, totalCount })}
                Displaying {from} - {to} out of {totalCount} issues.
            {/snippet}
        </Pagination>
    {/if}
</div>
