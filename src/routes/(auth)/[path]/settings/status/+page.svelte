<script lang="ts">
    import { Button, Input } from '~/lib/components';
    import type { PageData } from './$types';
    import AddStatusDialog from './AddStatusDialog.svelte';
    import TableStatus from './TableStatus.svelte';
    import { IconPlus, IconSearch } from '~/lib/components/icons';

    const { data }: { data: PageData } = $props();
    let showAddStatusDialog = $state(false);
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
                    class="bg-base-1 w-full border-none pl-8 shadow-none focus:ring-0"
                    placeholder="Search by name"
                />
                <IconSearch
                    class="text-base-fg-ghost absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2"
                />
            </div>
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
        </div>
    </div>
    <TableStatus {data} />
</main>
