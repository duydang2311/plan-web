<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { page } from '$app/state';
    import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
    import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { onMount } from 'svelte';
    import { toStore } from 'svelte/store';
    import invariant from 'tiny-invariant';
    import { addToast } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList } from '~/lib/models/paginatedList';
    import { compareRank, getRank } from '~/lib/utils/ranking';
    import type { PageData } from '../$types';
    import type { PageBoardData } from '../+page.server';
    import { createQueryKey } from '../utils';
    import Board from './Board.svelte';
    import { validateDraggableIssueData } from './utils';

    const { data }: { data: PageData } = $props();
    const queryKey = $derived(createQueryKey(page.url, { layout: 'board' }));
    const query = createQuery(
        toStore(() => ({
            queryKey: createQueryKey(page.url, { layout: 'board' }),
            enabled: page.data.tag === 'board',
            queryFn: async () => {
                invariant(page.data.tag === 'board', "tag must be 'board'");
                await invalidate('fetch:issues-board');
                return (await data.page) as PageBoardData;
            }
        }))
    );
    const queryClient = useQueryClient();
    const { api } = useRuntime();
    const mutation = createMutation({
        mutationFn: ({
            issueId,
            target
        }: {
            issueId: string;
            source: { statusId: number; statusRank: string };
            target: {
                statusRank: string;
                statusId: number;
            };
        }) =>
            api.patch(`issues/${issueId}`, {
                body: { patch: { statusRank: target.statusRank, statusId: target.statusId } }
            }),
        onMutate: async ({ issueId, source, target }) => {
            await queryClient.cancelQueries({ queryKey });
            const old = queryClient.getQueryData<PageBoardData>(queryKey);
            invariant(old, 'old must not be null');

            const sourceList = old.issueLists[source.statusId];
            const targetList = old.issueLists[target.statusId];
            const sourceIssue = sourceList.items.find((a) => a.id === issueId);
            invariant(sourceList, 'source list must not be null');
            invariant(targetList, 'target list must not be null');
            invariant(sourceIssue, 'source issue must not be null');

            const data: PageBoardData =
                source.statusId === target.statusId
                    ? {
                          ...old,
                          issueLists: {
                              ...old.issueLists,
                              [source.statusId]: paginatedList({
                                  items: sourceList.items
                                      .map((a) =>
                                          a.id === issueId
                                              ? {
                                                    ...a,
                                                    statusRank: target.statusRank
                                                }
                                              : a
                                      )
                                      .toSorted((a, b) => compareRank(a.statusRank, b.statusRank)),
                                  totalCount: sourceList.totalCount
                              })
                          }
                      }
                    : {
                          ...old,
                          issueLists: {
                              ...old.issueLists,
                              [source.statusId]: paginatedList({
                                  items: sourceList.items.filter((a) => a.id !== issueId),
                                  totalCount: sourceList.totalCount - 1
                              }),
                              [target.statusId]: paginatedList({
                                  items: [
                                      ...targetList.items,
                                      {
                                          ...sourceIssue,
                                          statusRank: target.statusRank,
                                          statusId: target.statusId
                                      }
                                  ].toSorted((a, b) => compareRank(a.statusRank, b.statusRank)),
                                  totalCount: targetList.totalCount + 1
                              })
                          }
                      };

            queryClient.setQueryData(queryKey, data);
            return { old, sourceIssue, target };
        },
        onSettled: async (response, error, { target }, context) => {
            draggingIssueId = null;
            if ((error || !response?.ok) && context) {
                const { old, sourceIssue } = context;
                queryClient.setQueryData(queryKey, old);

                const sourceStatus =
                    sourceIssue.statusId == null
                        ? null
                        : old.statuses.find((a) => a.id === sourceIssue.statusId!);
                const targetStatus =
                    target.statusId === -1
                        ? null
                        : old.statuses.find((a) => a.id === target.statusId!);
                addToast({
                    data: {
                        title: 'Could not move issue',
                        description: errorDescription,
                        descriptionProps: {
                            title: sourceIssue.title,
                            from: sourceStatus?.value ?? 'No status',
                            to: targetStatus?.value ?? 'No status'
                        }
                    }
                });
            }
            await queryClient.invalidateQueries({ queryKey });
        }
    });

    let draggingIssueId = $state.raw<string | null>(null);
    onMount(() => {
        return monitorForElements({
            canMonitor: ({ source }) => validateDraggableIssueData(source.data).ok,
            onDragStart: ({ source }) => {
                invariant(typeof source.data['id'] === 'string', 'source.data.id must be string');
                draggingIssueId = source.data['id'];
            },
            onDrop: ({ source, location }) => {
                if (!$query.data || location.current.dropTargets.length === 0) {
                    draggingIssueId = null;
                    return;
                }

                const target = location.current.dropTargets[0];
                const targetStatusId = target.data['statusId'];
                const sourceStatusId = source.data['statusId'];
                const sourceStatusRank = source.data['statusRank'];

                invariant(typeof sourceStatusId === 'number', 'source.statusId must be number');
                invariant(typeof sourceStatusRank === 'string', 'source.statusRank must be string');
                invariant(typeof source.data['id'] === 'string', 'source.data.id must be string');
                invariant(
                    typeof targetStatusId === 'number',
                    'target.data.statusId must be number'
                );

                const issueList = $query.data.issueLists[targetStatusId + ''];
                const sourceData = { statusId: sourceStatusId, statusRank: sourceStatusRank };
                if (target.data['type'] === 'board') {
                    $mutation.mutate({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            statusRank: getRank(null, issueList.items[0]?.statusRank || null)
                        }
                    });
                    return;
                }

                const targetId = target.data['id'];
                const targetStatusRank = target.data['statusRank'];
                invariant(typeof targetId === 'string', 'target.data.id must be string');
                invariant(
                    typeof targetStatusRank === 'string',
                    'target.data.statusRank must be string'
                );

                const edge = extractClosestEdge(target.data);
                if (edge === 'top') {
                    const previousIndex = issueList.items.findIndex((a) => a.id === targetId);
                    $mutation.mutate({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            statusRank: getRank(
                                previousIndex === 0 || previousIndex === -1
                                    ? null
                                    : issueList.items[previousIndex - 1].statusRank || null,
                                targetStatusRank || null
                            )
                        }
                    });
                } else {
                    const nextIndex = issueList.items.findIndex((a) => a.id === targetId);
                    $mutation.mutate({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            statusRank: getRank(
                                targetStatusRank || null,
                                nextIndex === issueList.items.length - 1 || nextIndex === -1
                                    ? null
                                    : issueList.items[nextIndex + 1].statusRank || null
                            )
                        }
                    });
                }
            }
        });
    });
</script>

{#snippet errorDescription({ title, from, to }: { title: string; from: string; to: string })}
    An unexpected error has occured while moving <strong>{title}</strong> from
    <strong>{from}</strong>
    to <strong>{to}</strong>.
{/snippet}

<div class="flex flex-col grow justify-between overflow-hidden">
    <div class="grow overflow-x-auto overflow-y-hidden w-full">
        {#if $query.data && $query.data.project}
            <ol class="flex h-full w-fit gap-4 p-4">
                {#each [{ id: -1, value: 'No status', color: 'bg-base-3' }, ...$query.data.statuses] as status (status.id)}
                    {@const list = $query.data.issueLists[status.id]}
                    <Board
                        identifier={$query.data.project.identifier}
                        issues={list.items.filter((a) => a.id !== draggingIssueId)}
                        {status}
                    />
                {/each}
            </ol>
        {/if}
    </div>
</div>
