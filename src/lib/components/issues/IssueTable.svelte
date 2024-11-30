<script lang="ts">
    import { page } from '$app/stores';
    import clsx from 'clsx';
    import { DateTime } from 'luxon';
    import { Icon, Link, Row, Table, Th, THead } from '~/lib/components';
    import {
        getPriorityIcon,
        getPriorityLabel,
        IssuePriorities,
        type Issue
    } from '~/lib/models/issue';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { stringifyQuery } from '~/lib/utils/url';

    interface Props {
        issues?: PaginatedList<
            Pick<
                Issue,
                'createdTime' | 'updatedTime' | 'id' | 'title' | 'orderNumber' | 'priority'
            > & {
                identifier: string;
                status?: {
                    value: string;
                };
            }
        >;
        status?: 'loading';
    }

    const { issues, status }: Props = $props();
    const issueQueryString = $derived(
        stringifyQuery(
            {
                team: $page.url.searchParams.get('team'),
                project: $page.url.searchParams.get('project')
            },
            { includeQuestionMark: true }
        )
    );
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
    <tbody class={clsx(status === 'loading' && 'animate-twPulse')}>
        {#if issues == null || issues.items.length === 0}
            <Row>
                <td class="col-span-full text-base-fg-ghost">No issues yet.</td>
            </Row>
        {:else}
            {#each issues.items as { id, createdTime, updatedTime, orderNumber, title, status, priority, identifier }}
                <Row>
                    <td>
                        <div
                            class="min-w-max block text-sm font-bold text-base-fg-3/60 content-center"
                        >
                            {identifier}-{orderNumber}
                        </div>
                    </td>
                    <td>
                        <Link href="/{$page.params['path']}/issues/{id}{issueQueryString}">
                            {title}
                        </Link>
                    </td>
                    <td>
                        {#if status?.value}
                            {status.value}
                        {:else}
                            <span class="text-base-fg-ghost">N/A</span>
                        {/if}
                    </td>
                    <td title={getPriorityLabel(priority)}>
                        <Icon
                            name={getPriorityIcon(priority)}
                            class={priority == IssuePriorities.none
                                ? 'text-base-fg-ghost'
                                : undefined}
                        />
                    </td>
                    <td
                        title={DateTime.fromISO(createdTime).toLocaleString(
                            DateTime.DATETIME_SHORT
                        )}
                    >
                        {DateTime.fromISO(createdTime).toRelative()}
                    </td>
                    <td
                        class="max-md:hidden"
                        title={DateTime.fromISO(updatedTime).toLocaleString(
                            DateTime.DATETIME_SHORT
                        )}
                    >
                        {DateTime.fromISO(updatedTime).toRelative()}
                    </td>
                </Row>
            {/each}
        {/if}
    </tbody>
</Table>
