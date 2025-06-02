<script lang="ts">
    import { page } from '$app/state';
    import { Avatar, RelativeTime, Row, Table, Th, THead } from '~/lib/components';
    import Pagination3 from '~/lib/components/Pagination3.svelte';
    import ThSort3 from '~/lib/components/ThSort3.svelte';
    import { priorityIcons } from '~/lib/models/issue';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { type AsyncRef } from '~/lib/utils/runes.svelte';
    import { createPagination } from '~/lib/utils/table.svelte';
    import type { LocalIssue } from './+page.server';
    import Milestone from './Milestone.svelte';
    import Priority from './Priority.svelte';
    import Status from './Status.svelte';

    const { issueListRef }: { issueListRef: AsyncRef<PaginatedList<LocalIssue>> } = $props();
    const pagination = createPagination({
        syncUrl: () => page.url,
        syncList: () => issueListRef.value ?? paginatedList()
    });
</script>

<div class="grid h-full grid-rows-[1fr_auto]">
    <div class="c-table--wrapper custom-scrollbar relative z-0 overflow-auto">
        <Table class="grid-cols-[auto_1fr_auto_auto_auto_auto_auto_auto]">
            <THead class="z-10">
                <Row class="py-2">
                    <Th class="col-span-2">Title</Th>
                    <ThSort3 name="priority">Priority</ThSort3>
                    <Th>Milestone</Th>
                    <ThSort3 name="status.rank">Status</ThSort3>
                    <Th>Assignees</Th>
                    <ThSort3 name="createdTime">Created</ThSort3>
                    <ThSort3 name="updatedTime" class="max-md:hidden">Updated</ThSort3>
                </Row>
            </THead>
            <tbody class:animate-pulse={issueListRef.loading.immediate}>
                {#if issueListRef.isInitialLoading}
                    {#each { length: 3 } as _}
                        <Row>
                            <td class="col-span-full">
                                <div class="bg-base-3 h-5 w-full animate-pulse"></div>
                            </td>
                        </Row>
                    {/each}
                {:else if issueListRef.value == null || issueListRef.value.items.length === 0}
                    <Row>
                        <td class="text-base-fg-ghost col-span-full">No issues found.</td>
                    </Row>
                {:else}
                    {#each issueListRef.value.items as row}
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
                                <p>
                                    {row.title}
                                </p>
                                <p class="c-text-secondary line-clamp-1">
                                    {row.previewDescription}
                                </p>
                            </td>
                            <td>
                                <div class="isolate">
                                    <Priority priority={row.priority} />
                                </div>
                            </td>
                            <td>
                                <div class="isolate">
                                    {#if row.milestone}
                                        <div class="grid grid-cols-[auto_1fr] items-center">
                                            <Milestone milestone={row.milestone} />
                                        </div>
                                    {:else}
                                        <span class="c-text-secondary text-base-fg-ghost">N/A</span>
                                    {/if}
                                </div>
                            </td>
                            <td>
                                <div class="isolate">
                                    {#if row.status}
                                        <Status status={row.status} />
                                    {:else}
                                        <span class="c-text-secondary text-base-fg-ghost">N/A</span>
                                    {/if}
                                </div>
                            </td>
                            <td>
                                <div class="flex gap-0.5">
                                    {#each row.assignees as assignee (assignee)}
                                        <Avatar
                                            title={assignee.profile?.displayName ?? assignee.email}
                                            size={64}
                                            user={assignee}
                                            class="size-avatar-sm isolate"
                                        />
                                    {/each}
                                </div>
                            </td>
                            <td class="first-letter:uppercase">
                                <div class="isolate">
                                    <RelativeTime time={row.createdTime} />
                                </div>
                            </td>
                            <td class="first-letter:uppercase">
                                <div class="isolate">
                                    <RelativeTime time={row.updatedTime} />
                                </div>
                            </td>
                        </Row>
                    {/each}
                {/if}
            </tbody>
        </Table>
    </div>
    {#if issueListRef.value != null && issueListRef.value.items.length > 0}
        <Pagination3 {pagination} class="mt-2">
            {#snippet label({ from, to, totalCount })}
                Showing <strong>{from}</strong> - <strong>{to}</strong> of
                <strong>{totalCount}</strong> issues.
            {/snippet}
        </Pagination3>
    {/if}
</div>
