<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
    import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import { createMutation } from '@tanstack/svelte-query';
    import { onMount } from 'svelte';
    import invariant from 'tiny-invariant';
    import { Row, Table, Th, THead } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { type AsyncRef } from '~/lib/utils/runes.svelte';
    import type { LocalWorkspaceStatus } from './+page.server';
    import StatusRow from './StatusRow.svelte';
    import { validateDraggleStatusData } from './utils';

    const {
        statusListRef,
        canDelete,
        canUpdate
    }: { statusListRef: AsyncRef<PaginatedList<LocalWorkspaceStatus>>; canDelete: boolean; canUpdate: boolean } = $props();
    const { api } = useRuntime();
    const mutation = createMutation({
        mutationFn: ({ statusId, rank }: { statusId: number; rank: number }) => {
            return api.patch(`workspace-statuses/${statusId}`, {
                body: { patch: { rank } }
            });
        },
        onMutate: async ({ statusId, rank }) => {
            const old = statusListRef.value;
            if (old) {
                statusListRef.value = paginatedList({
                    items: old.items
                        .map((a) => (a.id === statusId ? { ...a, rank } : a))
                        .toSorted((a, b) => a.rank - b.rank),
                    totalCount: old.totalCount
                });
            }
            return { old };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || !data?.ok) {
                if (context) {
                    statusListRef.value = context.old;
                }
            }
            await invalidateAll();
        }
    });

    onMount(() => {
        return monitorForElements({
            canMonitor: ({ source }) => validateDraggleStatusData(source.data).ok,
            onDrop: ({ source, location }) => {
                if (location.current.dropTargets.length === 0) {
                    return;
                }

                const target = location.current.dropTargets[0];
                const edge = extractClosestEdge(target.data);
                invariant(typeof source.data['id'] === 'number', 'source id must be number');
                invariant(typeof source.data['rank'] === 'number', 'source rank must be number');
                invariant(typeof target.data['id'] === 'number', 'target id must be number');
                invariant(typeof target.data['rank'] === 'number', 'target rank must be number');

                const previousData = statusListRef.value;
                if (previousData) {
                    const idx = previousData.items.findIndex((a) => a.id === target.data['id']);
                    let idx2: number | null = edge === 'top' ? idx - 1 : idx + 1;
                    if (idx2 < 0 || idx2 >= previousData.items.length) {
                        idx2 = null;
                    }

                    const MIN = 1 << 31;
                    const MAX = ~MIN;
                    const newRank = Math.floor(
                        previousData.items[idx].rank / 2 +
                            (idx2 != null
                                ? previousData.items[idx2].rank
                                : edge === 'top'
                                  ? MIN
                                  : MAX) /
                                2
                    );
                    $mutation.mutate({
                        statusId: source.data['id'],
                        rank: newRank
                    });
                }
            }
        });
    });
</script>

<div class="c-table--wrapper custom-scrollbar relative z-0 overflow-auto">
    <Table class="grid-cols-[auto_1fr_1fr_auto]">
        <THead class="z-10">
            <Row class="py-2">
                {#if canUpdate}
                    <Th></Th>
                {/if}
                <Th class={!canUpdate ? 'col-span-2' : undefined}>Name</Th>
                <Th>Description</Th>
                <Th>Actions</Th>
            </Row>
        </THead>
        <tbody>
            {#if statusListRef.isInitialLoading}
                <Row>
                    <td class="text-base-fg-ghost col-span-full">Loading...</td>
                </Row>
            {:else if statusListRef.value == null || statusListRef.value.items.length === 0}
                <Row>
                    <td class="text-base-fg-ghost col-span-full">No statuses found.</td>
                </Row>
            {:else}
                {#each statusListRef.value.items as status (status.id)}
                    <StatusRow {status} {canDelete} {canUpdate} />
                {/each}
            {/if}
        </tbody>
    </Table>
</div>
