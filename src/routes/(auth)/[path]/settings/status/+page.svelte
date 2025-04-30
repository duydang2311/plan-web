<script lang="ts">
    import { Button, Input } from '~/lib/components';
    import { IconPlus, IconSearch } from '~/lib/components/icons';
    import { permissions } from '~/lib/models/permission';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { PageData } from './$types';
    import AddStatusDialog from './AddStatusDialog.svelte';
    import TableStatus from './TableStatus.svelte';

    const { data }: { data: PageData } = $props();
    let showAddStatusDialog = $state(false);
    const workspacePermissionsRef = createRef.maybePromise(() => data.workspacePermissions);
    const can = $derived({
        create: workspacePermissionsRef.value?.has(permissions.createWorkspaceStatus) ?? false
    });
</script>

{#if showAddStatusDialog}
    <AddStatusDialog
        workspaceId={data.workspace.id}
        onClose={() => {
            showAddStatusDialog = false;
        }}
    />
{/if}
<main class="grid h-full w-full grid-rows-[auto_1fr]">
    <div class="border-b-base-border-2 border-b">
        <div class="flex justify-between gap-4 pl-4">
            <div class="relative grow">
                <Input
                    id="search"
                    type="text"
                    class="w-full rounded-none border-none bg-transparent pl-8 shadow-none"
                    placeholder="Search by name"
                />
                <IconSearch
                    class="text-base-fg-ghost absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2"
                />
            </div>
            {#if can.create}
                <Button
                    variant="base"
                    filled={false}
                    class="border-l-base-border-2 flex w-fit min-w-max items-center gap-2 border-l pr-4"
                    size="sm"
                    flat
                    onclick={() => {
                        showAddStatusDialog = true;
                    }}
                >
                    <IconPlus />
                    Add status
                </Button>
            {/if}
        </div>
    </div>
    <TableStatus {data} />
</main>
