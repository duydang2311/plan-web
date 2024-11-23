<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
    import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { onMount } from 'svelte';
    import invariant from 'tiny-invariant';
    import { Button, Icon, Input, Row, Table, Th, THead } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { PageData } from './$types';
    import { type LocalWorkspaceStatus } from './+page.server';
    import StatusRow from './StatusRow.svelte';
    import { validateDraggleStatusData } from './utils';

    const { data, onAddStatusClick }: { data: PageData; onAddStatusClick: () => void } = $props();
    const queryKey = ['workspace-statuses', { workspaceId: data.workspace.id }];
    const query = createQuery({
        queryKey,
        queryFn: async () => {
            await invalidate('fetch:workspace-statuses');
            return data.statusList;
        }
    });
    const queryClient = useQueryClient();
    const { httpClient } = useRuntime();
    const mutation = createMutation({
        mutationFn: ({ statusId, rank }: { statusId: number; rank: number }) => {
            return httpClient.patch(`/api/workspace-statuses/${statusId}`, {
                body: { patch: { rank } }
            });
        },
        onMutate: async ({ statusId, rank }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousData =
                queryClient.getQueryData<PaginatedList<LocalWorkspaceStatus>>(queryKey);
            if (previousData) {
                queryClient.setQueryData(queryKey, {
                    ...previousData,
                    items: previousData.items
                        .map((a) => (a.id === statusId ? { ...a, rank } : a))
                        .toSorted((a, b) => a.rank - b.rank)
                });
            }
            return { previousData };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || !data?.ok) {
                if (context) {
                    queryClient.setQueryData(queryKey, context.previousData);
                }
            }
            await queryClient.invalidateQueries({ queryKey });
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

                const previousData =
                    queryClient.getQueryData<PaginatedList<LocalWorkspaceStatus>>(queryKey);
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

<Table style="grid-template-columns: auto 1fr 1fr auto;">
    <THead class="relative">
        <Row class="border-b border-b-base-border-2 py-1">
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
                        size="sm"
                        onclick={onAddStatusClick}
                    >
                        <Icon name="plus" />
                        Add status
                    </Button>
                </div>
            </Th>
        </Row>
        <Row class="py-2">
            <Th></Th>
            <Th>Name</Th>
            <Th>Description</Th>
            <Th></Th>
        </Row>
    </THead>
    <tbody>
        {#if !$query.data}
            <Row>
                <td style="grid-column: 1 / -1;" class="text-base-fg-ghost">Loading data...</td>
            </Row>
        {:else if $query.data.items.length === 0}
            <Row>
                <td style="grid-column: 1 / -1;" class="text-base-fg-ghost">
                    No data to be displayed.
                </td>
            </Row>
        {:else}
            {#each $query.data.items as status (status.id)}
                <StatusRow {status} {queryKey} />
            {/each}
        {/if}
    </tbody>
</Table>
