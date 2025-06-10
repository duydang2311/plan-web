<script lang="ts">
    import { page } from '$app/state';
    import { Button, Main, Pagination3 } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import { paginatedList } from '~/lib/models/paginatedList';
    import { permissions } from '~/lib/models/permission';
    import { mapMaybePromise } from '~/lib/utils/promise';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { createPagination } from '~/lib/utils/table.svelte';
    import type { PageData } from './$types';
    import AddStatusDialog from './AddStatusDialog.svelte';
    import TableStatus from './TableStatus.svelte';
    import { toStore } from 'svelte/store';

    const { data }: { data: PageData } = $props();
    let showAddStatusDialog = $state.raw(false);
    const errorRef = createRef.maybePromise(() =>
        mapMaybePromise(data.getStatusList)((a) => (a.failed ? a.error : null))
    );
    const statusListRef = createRef.maybePromise(() =>
        mapMaybePromise(data.getStatusList)((a) => (a.ok ? a.data : undefined))
    );
    const workspacePermissionsRef = createRef.maybePromise(() => data.workspacePermissions);
    const can = $derived({
        create: workspacePermissionsRef.value?.has(permissions.createWorkspaceStatus) ?? false,
        update: workspacePermissionsRef.value?.has(permissions.updateWorkspaceStatus) ?? false,
        delete: workspacePermissionsRef.value?.has(permissions.deleteWorkspaceStatus) ?? false
    });
    const pagination = createPagination({
        syncList: () => statusListRef.value ?? paginatedList(),
        syncUrl: () => page.url
    });
</script>

<AddStatusDialog
    {statusListRef}
    workspaceId={data.workspace.id}
    open={toStore(
        () => showAddStatusDialog,
        (a) => (showAddStatusDialog = a)
    )}
/>

<Main>
    <div
        class="max-w-desktop relative mx-auto grid h-full grid-rows-[auto_minmax(24rem,1fr)_auto] gap-4"
    >
        <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div>
                <h1 class="capitalize">Workspace status</h1>
                <p class="c-text-secondary text-balance">
                    Create and manage task statuses to keep everyone aligned
                    from planning to production.
                </p>
            </div>
            {#if can.create}
                <Button
                    variant="primary"
                    class="flex w-full items-center gap-2 max-sm:justify-center sm:w-fit"
                    onclick={() => {
                        showAddStatusDialog = true;
                    }}
                >
                    <IconPlus />
                    Add status
                </Button>
            {/if}
        </div>
        {#if errorRef.value}
            <div class="row-span-3">
                <p>Something went wrong while retrieving workspace statuses.</p>
                <pre>{JSON.stringify(errorRef.value, null, 4)}</pre>
            </div>
        {:else}
            <TableStatus {statusListRef} canDelete={can.delete} canUpdate={can.update} />
            {#if statusListRef.value != null && statusListRef.value.items.length > 0}
                <Pagination3 {pagination}>
                    {#snippet label({ from, to, totalCount })}
                        Showing <strong>{from}</strong> - <strong>{to}</strong> of
                        <strong>{totalCount}</strong> workspace statuses.
                    {/snippet}
                </Pagination3>
            {/if}
        {/if}
    </div>
</Main>
