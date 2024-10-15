<script lang="ts">
    import type { PageData } from './$types';
    import AddStatusDialog from './AddStatusDialog.svelte';
    import TableStatus from './TableStatus.svelte';

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
<main class="h-full flex flex-col justify-between">
    <div class="flex flex-col justify-between grow overflow-auto">
        <TableStatus
            {data}
            onAddStatusClick={() => {
                showAddStatusDialog = true;
            }}
        />
    </div>
</main>
