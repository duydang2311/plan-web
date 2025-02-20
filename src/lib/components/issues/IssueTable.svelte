<script lang="ts">
    import clsx from 'clsx';
    import { DateTime } from 'luxon';
    import { Link, Row, Table, Th, THead } from '~/lib/components';
    import {
        getPriorityLabel,
        IssuePriorities,
        priorityIcons,
        type Issue
    } from '~/lib/models/issue';
    import type { PaginatedList } from '~/lib/models/paginatedList';

    type TableIssue = Pick<
        Issue,
        'createdTime' | 'updatedTime' | 'id' | 'title' | 'orderNumber' | 'priority'
    > & {
        identifier: string;
        status?: {
            value: string;
        };
    };

    interface Props {
        buildIssueHref: (issue: TableIssue) => string;
        issues?: PaginatedList<TableIssue>;
        status?: 'loading';
    }

    const { buildIssueHref, issues, status }: Props = $props();
</script>

<Table class="grid-cols-[auto_1fr_auto_auto_auto_auto]">
    <THead>
        <Row class="py-2">
            <Th sortable name="title" class="col-span-2">Title</Th>
            <Th sortable name="status.rank">Status</Th>
            <Th sortable name="priority">Priority</Th>
            <Th sortable name="createdTime">Created</Th>
            <Th sortable name="updatedTime" class="max-md:hidden">Updated</Th>
        </Row>
    </THead>
    <tbody class={clsx(status === 'loading' && 'animate-pulse')}>
        {#if issues == null || issues.items.length === 0}
            <Row>
                <td class="text-base-fg-ghost col-span-full">No issues yet.</td>
            </Row>
        {:else}
            {#each issues.items as issue (issue.id)}
                {@const PriorityIcon = priorityIcons[issue.priority]}
                <Row>
                    <td>
                        <div
                            class="text-base-fg-3/60 block min-w-max content-center text-sm font-bold"
                        >
                            {issue.identifier}-{issue.orderNumber}
                        </div>
                    </td>
                    <td>
                        <Link href={buildIssueHref(issue)}>
                            {issue.title}
                        </Link>
                    </td>
                    <td>
                        {#if issue.status?.value}
                            {issue.status.value}
                        {:else}
                            <span class="text-base-fg-ghost">N/A</span>
                        {/if}
                    </td>
                    <td title={getPriorityLabel(issue.priority)}>
                        <PriorityIcon
                            class={issue.priority == IssuePriorities.none
                                ? 'text-base-fg-ghost'
                                : undefined}
                        />
                    </td>
                    <td
                        title={DateTime.fromISO(issue.createdTime).toLocaleString(
                            DateTime.DATETIME_SHORT
                        )}
                    >
                        {DateTime.fromISO(issue.createdTime).toRelative()}
                    </td>
                    <td
                        class="max-md:hidden"
                        title={DateTime.fromISO(issue.updatedTime).toLocaleString(
                            DateTime.DATETIME_SHORT
                        )}
                    >
                        {DateTime.fromISO(issue.updatedTime).toRelative()}
                    </td>
                </Row>
            {/each}
        {/if}
    </tbody>
</Table>
