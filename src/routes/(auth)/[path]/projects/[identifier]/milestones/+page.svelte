<script lang="ts">
    import { page } from '$app/state';
    import { Button, Main, Pagination3, Row, Table, Th, THead, ThSort3 } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import { getMilestoneStatusIcon } from '~/lib/components/icons/utils';
    import { permissions } from '~/lib/models/permission';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { formatDateTimeUi } from '~/lib/utils/time';
    import type { PageProps } from './$types';
    import { createPagination } from '~/lib/utils/table.svelte';
    import { paginatedList } from '~/lib/models/paginatedList';

    const { data }: PageProps = $props();
    const getMilestonesRef = createRef.maybePromise(() => data.getMilestones);
    const projectPermissionsRef = createRef.maybePromise<Set<string> | undefined>(
        () => data.getProjectPermissions
    );
    const workspacePermissionsRef = createRef.maybePromise<Set<string> | undefined>(
        () => data.workspacePermissions
    );
    const can = $derived({
        create:
            (projectPermissionsRef.value?.has(permissions.createMilestone) ||
                workspacePermissionsRef.value?.has(permissions.createMilestone)) ??
            false,
        delete:
            (projectPermissionsRef.value?.has(permissions.deleteMilestone) ||
                workspacePermissionsRef.value?.has(permissions.deleteMilestone)) ??
            false
    });
    const pagination = createPagination({
        syncUrl: () => page.url,
        syncList: () => (getMilestonesRef.value?.ok ? getMilestonesRef.value.data : paginatedList())
    });
</script>

<Main>
    <div class="max-w-desktop @container min-h-128 mx-auto flex h-full flex-col">
        <div class="@xl:flex-row @xl:items-baseline flex flex-col gap-x-16 gap-y-4">
            <div>
                <h1 class="font-h-bold">Milestones</h1>
                <p class="c-text-secondary text-pretty">
                    Track, view, and manage every milestone in your project – Milestones represent
                    critical phases or deliverables that help you monitor and drive project success.
                </p>
            </div>
            {#if can.create}
                <Button
                    as="link"
                    href="/{page.params.path}/projects/{page.params.identifier}/milestones/new"
                    variant="primary"
                    class="@xl:w-fit flex w-full shrink-0 items-center justify-center gap-2 capitalize"
                >
                    <IconPlus />
                    Create milestone
                </Button>
            {/if}
        </div>
        <div class="mt-4 flex-1">
            {#if getMilestonesRef.isInitialLoading}
                <span class="c-text-secondary">Loading...</span>
            {:else if getMilestonesRef.value.failed}
                <span class="c-text-secondary">
                    Something went wrong while loading milestones:
                    <strong>
                        {getMilestonesRef.value.error.message} ({getMilestonesRef.value.error.code})
                    </strong>.
                </span>
            {:else}
                <div class="flex min-h-full flex-col gap-2">
                    <div class="c-table--wrapper relative flex-1 overflow-auto">
                        <Table class="grid-cols-[1fr_auto_auto_auto]">
                            <THead>
                                <Row class="py-2">
                                    <Th>Title</Th>
                                    <ThSort3 name="endTime">Due date</ThSort3>
                                    <Th>Status</Th>
                                    {#if can.delete}
                                        <Th>Actions</Th>
                                    {/if}
                                </Row>
                            </THead>
                            <tbody>
                                {#each getMilestonesRef.value.data.items as milestone (milestone.id)}
                                    <Row>
                                        <td>
                                            {milestone.title}
                                        </td>
                                        <td>
                                            {formatDateTimeUi(milestone.endTime)}
                                        </td>
                                        <td>
                                            {#if milestone.status}
                                                {@const Icon = getMilestoneStatusIcon(
                                                    milestone.status.icon
                                                )}
                                                <div
                                                    class="flex items-center gap-2 px-1"
                                                    style="color: {milestone.status
                                                        .color}; background-color: color-mix(in oklch, {milestone
                                                        .status.color} 5%, transparent);"
                                                >
                                                    {#if Icon}
                                                        <Icon />
                                                    {/if}
                                                    {milestone.status.value}
                                                </div>
                                            {:else}
                                                <span class="c-text-secondary">No status</span>
                                            {/if}
                                        </td>
                                        {#if can.delete}
                                            <td>Delete</td>
                                        {/if}
                                    </Row>
                                {/each}
                            </tbody>
                        </Table>
                    </div>
                    <Pagination3 {pagination} />
                </div>
            {/if}
        </div>
    </div>
</Main>
