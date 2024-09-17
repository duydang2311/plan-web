<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import type { PageData } from './$types';
    import { invalidate } from '$app/navigation';
    import { Pagination, Row, Table, Th, THead } from '~/lib/components';
    import { DateTime } from 'luxon';

    const { data }: { data: PageData } = $props();

    const query = createQuery({
        queryKey: ['project-issues'],
        queryFn: async () => {
            await invalidate('fetch:project-issues');
            return await data.projectIssueList;
        }
    });
</script>

<main class="flex flex-col justify-between h-full overflow-auto">
    <Table style="grid-template-columns: 1fr auto auto auto;">
        <THead>
            <Row class="py-2">
                <Th sortable name="issue.title">Title</Th>
                <Th sortable name="issue.createdTime">Created</Th>
                <Th sortable name="issue.updatedTime">Updated</Th>
                <Th></Th>
            </Row>
        </THead>
        <tbody>
            {#if !$query.data}
                <Row>
                    <td style="grid-column: 1 / -1;">Loading issues...</td>
                </Row>
            {:else if $query.data.items.length === 0}
                <Row>
                    <td style="grid-column: 1 / -1;">No issues yet.</td>
                </Row>
            {:else}
                {#each $query.data.items as { issue: { id, title, createdTime, updatedTime } } (id)}
                    <Row>
                        <td>{title}</td>
                        <td>{DateTime.fromISO(createdTime).toLocaleString(DateTime.DATE_MED)}</td>
                        <td>{DateTime.fromISO(updatedTime).toLocaleString(DateTime.DATE_MED)}</td>
                        <td>Delete</td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    {#if $query.data && data.query}
        <Pagination query={data.query} list={$query.data}>
            {#snippet label({ from, to, totalCount })}
                Displaying {from} - {to} out of {totalCount} teams.
            {/snippet}
        </Pagination>
    {/if}
</main>
