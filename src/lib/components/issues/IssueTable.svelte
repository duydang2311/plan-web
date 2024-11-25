<script lang="ts">
    import { page } from '$app/stores';
    import clsx from 'clsx';
    import { DateTime } from 'luxon';
    import { Link, Pagination, Row, Table, Th, THead } from '~/lib/components';
    import type { Issue } from '~/lib/models/issue';
    import type { PaginatedList } from '~/lib/models/paginatedList';

    interface Props {
        teamIdentifier: string;
        issues?: PaginatedList<
            Pick<Issue, 'createdTime' | 'updatedTime' | 'id' | 'title' | 'orderNumber'>
        >;
        status?: 'loading';
        pagination?: {
            page: number;
            offset: number;
            size: number;
            length: number;
            totalCount: number;
        };
    }

    const { issues, status, teamIdentifier, pagination }: Props = $props();
</script>

<div class="flex flex-col grow justify-between overflow-auto">
    <Table style="grid-template-columns: auto 1fr 1fr auto;">
        <THead>
            <Row class="py-2">
                <Th sortable name="title" class="col-span-2">Title</Th>
                <Th sortable name="createdTime">Created</Th>
                <Th sortable name="updatedTime">Updated</Th>
            </Row>
        </THead>
        <tbody class={clsx(status === 'loading' && 'animate-twPulse')}>
            {#if status === 'loading'}
                <Row>
                    <td style="grid-column: 1 / -1;">Loading issues...</td>
                </Row>
            {:else if issues == null || issues.items.length === 0}
                <Row>
                    <td style="grid-column: 1 / -1;">No issues yet.</td>
                </Row>
            {:else}
                {#each issues.items as { id, createdTime, updatedTime, orderNumber, title }}
                    <Row>
                        <td>
                            <div
                                class="min-w-max block text-sm font-bold text-base-fg-3/60 content-center"
                            >
                                {teamIdentifier}-{orderNumber}
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
    {#if issues && pagination}
        <Pagination {...pagination}>
            {#snippet label({ from, to, totalCount })}
                Displaying {from} - {to} out of {totalCount} issues.
            {/snippet}
        </Pagination>
    {/if}
</div>
