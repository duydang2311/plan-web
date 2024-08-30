<script lang="ts">
    import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { onMount } from 'svelte';
    import type { Issue } from '~/lib/models/issue';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { Status } from '~/lib/models/status';
    import type { PageData } from '../$types';
    import Board from './Board.svelte';
    import { validateDraggableIssueData } from './utils';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import invariant from 'tiny-invariant';
    import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
    import { orderBy } from 'natural-orderby';
    import { addToast } from '~/lib/components';
    import { invalidate } from '$app/navigation';

    interface Data {
        statuses: Status[];
        issueLists: Record<string, PaginatedList<Issue>>;
    }

    const { data }: { data: PageData } = $props();
    const queryKey = ['issues', { layout: 'board' }];
    const query = createQuery<Data>({
        queryKey,
        queryFn: async () => {
            await invalidate('fetch:issues-board');
            return await data.board!;
        }
    });
    const queryClient = useQueryClient();
    const { httpClient } = useRuntime();
    const mutation = createMutation({
        mutationFn: ({
            issueId,
            target
        }: {
            issueId: string;
            source: { statusId: number; orderByStatus: number };
            target: {
                orderByStatus: number;
                statusId: number;
            };
        }) =>
            httpClient.patch(`/api/issues/${issueId}/status`, {
                body: { orderByStatus: target.orderByStatus, statusId: target.statusId }
            }),
        onMutate: async ({ issueId, source, target }) => {
            await queryClient.cancelQueries({ queryKey });
            const data = queryClient.getQueryData<Data>(queryKey);
            invariant(data, 'data must not be null');
            const lists: typeof data.issueLists = {};

            const sourceList = data.issueLists[source.statusId];
            invariant(sourceList, 'sourceList must not be null');

            const sourceIssue = sourceList.items.find((a) => a.id === issueId);
            invariant(sourceIssue, 'sourceIssue must not be null');

            const mapItem = (a: Issue) =>
                a.id === issueId
                    ? {
                          ...sourceIssue,
                          statusId: target.statusId,
                          orderByStatus: target.orderByStatus
                      }
                    : a.orderByStatus <= target.orderByStatus
                      ? { ...a, orderByStatus: a.orderByStatus - 1 }
                      : a;

            for (const k in data.issueLists) {
                const statusId = Number(k);
                if (source.statusId === target.statusId) {
                    lists[k] =
                        statusId === source.statusId
                            ? paginatedList({
                                  items: orderBy(
                                      data.issueLists[k].items.map(mapItem),
                                      [(a) => a.orderByStatus, (a) => a.createdTime],
                                      ['desc', 'desc']
                                  )
                              })
                            : data.issueLists[k];
                    continue;
                }

                if (statusId === source.statusId) {
                    lists[k] = paginatedList({
                        items: data.issueLists[k].items.filter((a) => a.id !== issueId)
                    });
                } else if (statusId === target.statusId) {
                    lists[k] = paginatedList({
                        items: orderBy(
                            [sourceIssue, ...data.issueLists[k].items].map(mapItem),
                            [(a) => a.orderByStatus, (a) => a.createdTime],
                            ['desc', 'desc']
                        )
                    });
                } else {
                    lists[k] = data.issueLists[k];
                }
            }

            queryClient.setQueryData<Data>(queryKey, {
                statuses: data.statuses,
                issueLists: lists
            });
            return { previous: data, sourceIssue, target };
        },
        onSettled: async (response, error, { target }, context) => {
            if ((error || !response?.ok) && context) {
                const { previous, sourceIssue } = context;
                queryClient.setQueryData(queryKey, previous);
                const sourceStatus =
                    sourceIssue.statusId == null
                        ? 'No status'
                        : previous.statuses.find((a) => a.id === sourceIssue.statusId)!.value;
                const targetStatus =
                    target.statusId === -1
                        ? 'No status'
                        : previous.statuses.find((a) => a.id === target.statusId)!.value;
                addToast({
                    data: {
                        title: '',
                        description: `Could not move issue ${sourceIssue.title} from ${sourceStatus} to ${targetStatus}.`
                    }
                });
            } else if (response && response.ok) {
                await queryClient.invalidateQueries({ queryKey });
            }
        }
    });

    $inspect($query.data);

    onMount(() => {
        return monitorForElements({
            canMonitor: ({ source }) => validateDraggableIssueData(source.data).ok,
            onDrop: ({ source, location }) => {
                if (location.current.dropTargets.length === 0) {
                    return;
                }

                const target = location.current.dropTargets[0];
                const targetStatusId = target.data['statusId'];
                const sourceStatusId = source.data['statusId'];
                const sourceOrderByStatus = source.data['orderByStatus'];

                invariant(typeof sourceStatusId === 'number', 'source.statusId must be number');
                invariant(
                    typeof sourceOrderByStatus === 'number',
                    'source.orderByStatus must be number'
                );
                invariant(typeof source.data['id'] === 'string', 'source.data.id must be string');
                invariant(
                    typeof targetStatusId === 'number',
                    'target.data.statusId must be number'
                );

                const sourceData = { statusId: sourceStatusId, orderByStatus: sourceOrderByStatus };
                if (target.data['type'] === 'board') {
                    const targetOrderByStatus =
                        $query.data?.issueLists[targetStatusId + '']?.items[0]?.orderByStatus ?? 0;
                    $mutation.mutate({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            orderByStatus: targetOrderByStatus
                        }
                    });
                    return;
                }

                const targetOrderByStatus = target.data['orderByStatus'];
                invariant(
                    typeof targetOrderByStatus === 'number',
                    'target.data.orderByStatus must be number'
                );

                const edge = extractClosestEdge(target.data);
                $mutation.mutate({
                    issueId: source.data['id'],
                    source: sourceData,
                    target: {
                        statusId: targetStatusId,
                        orderByStatus:
                            edge === 'top' ? targetOrderByStatus : targetOrderByStatus - 1
                    }
                });
            }
        });
    });
</script>

<div class="flex flex-col grow justify-between overflow-hidden">
    <div class="grow overflow-x-auto overflow-y-hidden w-full">
        {#if $query.data}
            <ol class="flex h-full w-fit gap-4 p-4">
                {#each [{ id: -1, value: 'No status', color: 'bg-base-3' }, ...$query.data.statuses] as status (status.id)}
                    {@const list = $query.data.issueLists[status.id]}
                    <Board identifier={data.team.identifier} issues={list.items} {status} />
                {/each}
            </ol>
        {/if}
    </div>
</div>
