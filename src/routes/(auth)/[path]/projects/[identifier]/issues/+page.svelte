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

<main class="grid grid-rows-[1fr_auto] h-full overflow-auto">
    <Table style="grid-template-columns: auto 1fr auto auto;">
        <THead>
            <Row class="py-2">
                <Th></Th>
                <Th sortable name="issue.title">Title</Th>
                <Th sortable name="issue.createdTime">Created</Th>
                <Th sortable name="issue.updatedTime">Updated</Th>
            </Row>
        </THead>
        <tbody>
            {#if !$query.data}
                <Row>
                    <td class="col-span-full text-base-fg-ghost">Loading issues...</td>
                </Row>
            {:else if $query.data.items.length === 0}
                <Row>
                    <td class="col-span-full text-base-fg-ghost">No issues yet.</td>
                </Row>
            {:else}
                {#each $query.data.items as { issue: { id, title, createdTime, updatedTime, orderNumber, team: { identifier } } } (id)}
                    <Row>
                        <td>
                            <div
                                class="min-w-max block text-sm font-bold text-base-fg-3/60 content-center"
                            >
                                {identifier}-{orderNumber}
                            </div>
                        </td>
                        <td>{title}</td>
                        <td>{DateTime.fromISO(createdTime).toLocaleString(DateTime.DATE_MED)}</td>
                        <td>{DateTime.fromISO(updatedTime).toLocaleString(DateTime.DATE_MED)}</td>
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
</main>
