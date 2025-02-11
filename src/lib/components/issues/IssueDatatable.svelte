<script lang="ts">
    import type { CreateQueryResult } from '@tanstack/svelte-query';
    import { DateTime } from 'luxon';
    import { Icon, Link, Row, Table, THead, ThSort2 } from '~/lib/components';
    import type { Issue } from '~/lib/models/issue';
    import { getPriorityIcon, getPriorityLabel, IssuePriorities } from '~/lib/models/issue';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { type PaginationHandler, type Sort } from '~/lib/utils/table.svelte';
    import Pagination2 from '../Pagination2.svelte';

    type TableIssue = Pick<
        Issue,
        'createdTime' | 'updatedTime' | 'id' | 'title' | 'orderNumber' | 'priority'
    > & {
        project: { identifier: string };
        status?: {
            value: string;
        };
    };

    interface Props {
        query: CreateQueryResult<PaginatedList<TableIssue>>;
        sort: Sort;
        pagination: PaginationHandler;
        buildIssueHref: (row: TableIssue) => string;
    }

    const { query, sort, pagination, buildIssueHref }: Props = $props();
</script>

<div class="grid grid-rows-[1fr_auto]">
    <Table class="grid-cols-[auto_1fr_auto_auto_auto_auto]">
        <THead>
            <Row class="py-1">
                <ThSort2 field={sort.field('title')} html={{ class: 'col-span-2' }}>Title</ThSort2>
                <ThSort2 field={sort.field('status')}>Status</ThSort2>
                <ThSort2 field={sort.field('priority')}>Priority</ThSort2>
                <ThSort2 field={sort.field('createdTime')}>Created</ThSort2>
                <ThSort2 field={sort.field('updatedTime')} html={{ class: 'max-md:hidden' }}>
                    Updated
                </ThSort2>
            </Row>
        </THead>
        <tbody class:animate-pulse={$query.isFetching}>
            {#if $query.data == null || $query.data.items.length === 0}
                <Row>
                    <td class="col-span-full text-base-fg-ghost">No issues yet.</td>
                </Row>
            {:else}
                {#each $query.data.items as row}
                    <Row>
                        <td>
                            <div
                                class="min-w-max block text-sm font-bold text-base-fg-3/60 content-center"
                            >
                                {row.project.identifier}-{row.orderNumber}
                            </div>
                        </td>
                        <td>
                            <Link href={buildIssueHref(row)}>
                                {row.title}
                            </Link>
                        </td>
                        <td>
                            {#if row.status?.value}
                                {row.status.value}
                            {:else}
                                <span class="text-base-fg-ghost">N/A</span>
                            {/if}
                        </td>
                        <td title={getPriorityLabel(row.priority)}>
                            <Icon
                                name={getPriorityIcon(row.priority)}
                                class={row.priority == IssuePriorities.none
                                    ? 'text-base-fg-ghost'
                                    : undefined}
                            />
                        </td>
                        <td
                            title={DateTime.fromISO(row.createdTime).toLocaleString(
                                DateTime.DATETIME_SHORT
                            )}
                        >
                            {DateTime.fromISO(row.createdTime).toRelative()}
                        </td>
                        <td
                            class="max-md:hidden"
                            title={DateTime.fromISO(row.updatedTime).toLocaleString(
                                DateTime.DATETIME_SHORT
                            )}
                        >
                            {DateTime.fromISO(row.updatedTime).toRelative()}
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    <Pagination2 {pagination} />
</div>
