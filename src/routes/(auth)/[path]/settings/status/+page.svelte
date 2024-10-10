<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { createQuery } from '@tanstack/svelte-query';
    import { Button, Icon, IconButton, Input, Row, Table, Th, THead } from '~/lib/components';
    import type { PageData } from './$types';
    import AddStatusDialog from './AddStatusDialog.svelte';

    const { data }: { data: PageData } = $props();
    const queryKey = ['workspace-statuses', { workspaceId: data.workspace.id }];
    const query = createQuery({
        queryKey,
        queryFn: async () => {
            await invalidate('fetch:workspace-statuses');
            return data.statusList;
        }
    });
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
        <Table style="grid-template-columns: 1fr 1fr auto;">
            <THead>
                <Row class="border-b border-b-base-border py-1">
                    <Th style="grid-column: 1 / -1;" class="px-0">
                        <div class="flex justify-between items-center gap-4">
                            <div class="relative">
                                <Input
                                    id="search"
                                    type="text"
                                    class="w-48 border-none focus:ring-0 shadow-none pl-8"
                                    placeholder="Search by name"
                                />
                                <Icon
                                    name="search"
                                    class="absolute left-0 top-1/2 translate-x-1/2 -translate-y-1/2 text-base-fg-ghost"
                                />
                            </div>
                            <Button
                                filled={false}
                                class="flex gap-2 items-center w-fit min-w-max"
                                onclick={() => {
                                    showAddStatusDialog = true;
                                }}
                            >
                                <Icon name="plus" />
                                Add status
                            </Button>
                        </div>
                    </Th>
                </Row>
                <Row class="py-2">
                    <Th>Name</Th>
                    <Th>Description</Th>
                    <Th></Th>
                </Row>
            </THead>
            <tbody>
                {#if $query.data && $query.data.items}
                    {#each $query.data.items as { id, value, description } (id)}
                        <Row>
                            <td
                                class="whitespace-nowrap overflow-hidden text-ellipsis"
                                title={value}>{value}</td
                            >
                            <td
                                class="whitespace-nowrap overflow-hidden text-ellipsis"
                                title={description}
                            >
                                {#if description}
                                    {description}
                                {:else}
                                    <span class="text-base-fg-ghost"></span>
                                {/if}
                            </td>
                            <td class="flex flex-wrap gap-2">
                                <IconButton
                                    type="button"
                                    variant="negative"
                                    title="Remove member"
                                    class="w-fit"
                                >
                                    <Icon name="trash" />
                                </IconButton>
                            </td>
                        </Row>
                    {/each}
                {/if}
            </tbody>
        </Table>
    </div>
</main>
