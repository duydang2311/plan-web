<script lang="ts">
    import { page } from '$app/state';
    import { DateTime } from 'luxon';
    import { Link, RelativeTime, Row, Table, Th, THead } from '~/lib/components';
    import Pagination3 from '~/lib/components/Pagination3.svelte';
    import ThSort3 from '~/lib/components/ThSort3.svelte';
    import { getPriorityLabel, IssuePriorities, priorityIcons } from '~/lib/models/issue';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { type Loading } from '~/lib/utils/runes.svelte';
    import { createPagination } from '~/lib/utils/table.svelte';
    import type { LocalIssue } from './+page.server';

    const {
        issueList,
        loading
    }: { issueList: PaginatedList<LocalIssue> | undefined; loading: Loading } = $props();
    const pagination = createPagination({
        syncUrl: () => page.url,
        syncList: () => issueList ?? paginatedList()
    });
</script>

<div class="grid h-full grid-rows-[1fr_auto]">
    <Table class="grid-cols-[auto_1fr_auto_auto_auto_auto]">
        <THead>
            <Row class="py-2">
                <ThSort3 name="title" class="col-span-2">Title</ThSort3>
                <Th>Status</Th>
                <ThSort3 name="priority">Priority</ThSort3>
                <ThSort3 name="createdTime">Created</ThSort3>
                <ThSort3 name="updatedTime" class="max-md:hidden">Updated</ThSort3>
            </Row>
        </THead>
        <tbody class:animate-pulse={loading.immediate}>
            {#if issueList == null && loading.immediate}
                {#each { length: 3 } as _}
                    <Row>
                        <td>
                            <div class="bg-base-3 h-5 w-16 animate-pulse"></div>
                        </td>
                        <td>
                            <div class="bg-base-3 h-5 w-64 animate-pulse"></div>
                        </td>
                        <td>
                            <div class="bg-base-3 h-5 w-24 animate-pulse"></div>
                        </td>
                        <td>
                            <div class="bg-base-3 h-5 w-24 animate-pulse"></div>
                        </td>
                        <td>
                            <div class="bg-base-3 h-5 w-32 animate-pulse"></div>
                        </td>
                        <td>
                            <div class="bg-base-3 h-5 w-32 animate-pulse"></div>
                        </td>
                    </Row>
                {/each}
            {:else if issueList == null || issueList.items.length === 0}
                <Row>
                    <td class="text-base-fg-ghost col-span-full">No issues yet.</td>
                </Row>
            {:else}
                {#each issueList.items as row}
                    {@const IconPriority = priorityIcons[row.priority]}
                    <Row class="relative">
                        <td>
                            <a
                                href="/{page.params.path}/projects/{page.params
                                    .identifier}/issues/{row.orderNumber}"
                                aria-labelledby="issue-{row.orderNumber}"
                                class="absolute inset-0"
                            ></a>
                            <div
                                class="text-base-fg-3/60 block min-w-max content-center text-sm font-bold"
                            >
                                {row.project.identifier}-{row.orderNumber}
                            </div>
                        </td>
                        <td id="issue-{row.orderNumber}">
                            {row.title}
                        </td>
                        <td>
                            {#if row.status?.value}
                                {row.status.value}
                            {:else}
                                <span class="text-base-fg-ghost">N/A</span>
                            {/if}
                        </td>
                        <td title={getPriorityLabel(row.priority)}>
                            <IconPriority
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
                            <RelativeTime time={row.createdTime} />
                        </td>
                        <td
                            title={DateTime.fromISO(row.updatedTime).toLocaleString(
                                DateTime.DATETIME_SHORT
                            )}
                        >
                            <RelativeTime time={row.updatedTime} />
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    <Pagination3 {pagination} />
</div>
