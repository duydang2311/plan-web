<script lang="ts">
    import { page } from '$app/state';
    import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
    import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
    import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
    import { createMutation, useQueryClient, type InfiniteData } from '@tanstack/svelte-query';
    import { onMount } from 'svelte';
    import invariant from 'tiny-invariant';
    import { addToast, Icon } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { deeplyFind } from '~/lib/utils/array';
    import { compareRank, getRank } from '~/lib/utils/ranking';
    import type { LocalBoardIssue, LocalWorkspaceStatus } from '../+page.server';
    import { createBoardQueryParams } from '../utils';
    import Board from './Board.svelte';
    import {
        createIssueListQueryKey,
        createStatusListQuery,
        createStatusListQueryKey,
        validateDraggableIssueData
    } from './utils';

    const {
        workspaceId,
        projectId,
        projectIdentifier
    }: { workspaceId: string; projectId: string; projectIdentifier: string } = $props();
    const statusListQuery = createStatusListQuery(() => ({ workspaceId }));
    const queryClient = useQueryClient();
    const { api } = useRuntime();
    let preview = $state.raw<{
        container: HTMLElement;
        rect: DOMRect;
        data: Record<string, unknown>;
    } | null>(null);

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
            await queryClient.cancelQueries({
                predicate: ({ queryKey }) =>
                    queryKey[0] === 'issues' &&
                    queryKey[1] != null &&
                    typeof queryKey[1] === 'object' &&
                    'tag' in queryKey[1] &&
                    queryKey[1].tag === 'issues-board' &&
                    'statusId' in queryKey[1] &&
                    (queryKey[1].statusId === source.statusId ||
                        queryKey[1].statusId === target.statusId)
            });

            const sourceQK = createIssueListQueryKey(() => ({
                params: createBoardQueryParams(page.url),
                projectId,
                statusId: source.statusId
            }));
            const targetQK = createIssueListQueryKey(() => ({
                params: createBoardQueryParams(page.url),
                projectId,
                statusId: target.statusId
            }));
            const sourceList =
                queryClient.getQueryData<InfiniteData<PaginatedList<LocalBoardIssue>, number>>(
                    sourceQK
                );
            const targetList =
                queryClient.getQueryData<InfiniteData<PaginatedList<LocalBoardIssue>, number>>(
                    targetQK
                );

            invariant(sourceList, 'source list must not be null');
            invariant(targetList, 'target list must not be null');

            const sourceIssue = deeplyFind(
                sourceList.pages,
                (a) => a.items
            )((a) => a.id === issueId);
            invariant(sourceIssue, 'source issue must not be null');

            if (source.statusId === target.statusId) {
                const all = sourceList.pages.flatMap((a) => a.items);
                const index = all.findIndex((a) => a.id === issueId);
                if (index === -1) {
                    return;
                }
                all[index] = { ...all[index], statusRank: target.statusRank };
                all.sort((a, b) => compareRank(a.statusRank, b.statusRank));
                const optimisticPages: PaginatedList<LocalBoardIssue>[] = [];
                let start = 0;
                for (const page of sourceList.pages) {
                    const end = start + page.items.length;
                    optimisticPages.push(
                        paginatedList({
                            items: all.slice(start, end),
                            totalCount: page.totalCount
                        })
                    );
                    start = end;
                }
                queryClient.setQueryData(sourceQK, {
                    pages: optimisticPages,
                    pageParams: sourceList.pageParams
                });
                return;
            }

            const removeFromSource = () => {
                const removed = sourceList.pages
                    .flatMap((a) => a.items)
                    .filter((a) => a.id !== issueId)
                    .toSorted((a, b) => compareRank(a.statusRank, b.statusRank));
                let start = 0;
                const optimisticPages: PaginatedList<LocalBoardIssue>[] = [];
                const optimisticPageParams: number[] = [];
                let it = 0;
                for (const page of sourceList.pages) {
                    if (start >= removed.length) {
                        break;
                    }
                    const end = start + page.items.length;
                    optimisticPages.push(
                        paginatedList({
                            items: removed.slice(start, end),
                            totalCount: page.totalCount - 1
                        })
                    );
                    optimisticPageParams.push(sourceList.pageParams[it++]);
                    start = end;
                }
                queryClient.setQueryData(sourceQK, {
                    pages: optimisticPages,
                    pageParams: optimisticPageParams
                });
            };

            const addToTarget = () => {
                const added = [
                    ...targetList.pages.flatMap((a) => a.items),
                    { ...sourceIssue, statusRank: target.statusRank, statusId: target.statusId }
                ].toSorted((a, b) => compareRank(a.statusRank, b.statusRank));
                let start = 0;
                const optimisticPages: PaginatedList<LocalBoardIssue>[] = [];
                const optimisticPageParams: number[] = [];
                let it = 0;
                for (const page of sourceList.pages) {
                    const end = start + page.items.length;
                    optimisticPages.push(
                        paginatedList({
                            items: added.slice(start, end),
                            totalCount: page.totalCount + 1
                        })
                    );
                    optimisticPageParams.push(sourceList.pageParams[it++]);
                    start = end;
                }

                const size = sourceQK[1].params.size as number;
                const lastPage = optimisticPages.at(-1)!;
                while (start < added.length) {
                    const gaps = size - lastPage.items.length;
                    if (gaps > 0) {
                        lastPage.items.push(...added.slice(start, start + gaps));
                        start += gaps;
                    } else {
                        optimisticPageParams.push(start);
                        optimisticPages.push(
                            paginatedList({
                                items: added.slice(start, start + size),
                                totalCount: lastPage.totalCount + 1
                            })
                        );
                        start += size;
                    }
                }

                queryClient.setQueryData(targetQK, {
                    pages: optimisticPages,
                    pageParams: optimisticPageParams
                });
            };

            removeFromSource();
            addToTarget();

            return { sourceQK, sourceList, targetQK, targetList, sourceIssue, target };
        },
        onSettled: async (response, error, { source, target }, context) => {
            if ((error || !response?.ok) && context) {
                const { sourceQK, sourceList, targetQK, targetList, sourceIssue } = context;
                queryClient.setQueryData(sourceQK, sourceList);
                queryClient.setQueryData(targetQK, targetList);

                const statusList = queryClient.getQueryData<PaginatedList<LocalWorkspaceStatus>>(
                    createStatusListQueryKey(() => ({
                        workspaceId
                    }))
                );
                if (!statusList) {
                    return;
                }

                const sourceStatus =
                    sourceIssue.statusId == null
                        ? null
                        : statusList.items.find((a) => a.id === sourceIssue.statusId!);
                const targetStatus =
                    target.statusId === -1
                        ? null
                        : statusList.items.find((a) => a.id === target.statusId!);

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

            await queryClient.invalidateQueries({
                predicate: ({ queryKey }) => {
                    if (queryKey[0] !== 'issues') {
                        return false;
                    }
                    if (
                        queryKey[1] != null &&
                        typeof queryKey[1] === 'object' &&
                        'tag' in queryKey[1] &&
                        queryKey[1].tag === 'issues-board'
                    ) {
                        return (
                            'projectId' in queryKey[1] &&
                            queryKey[1].projectId === projectId &&
                            'statusId' in queryKey[1] &&
                            (queryKey[1].statusId ===
                                (source.statusId === -1 ? null : source.statusId) ||
                                queryKey[1].statusId ===
                                    (target.statusId === -1 ? null : target.statusId))
                        );
                    }
                    return true;
                }
            });
        }
    });

    onMount(() => {
        return monitorForElements({
            canMonitor: ({ source }) => validateDraggableIssueData(source.data).ok,
            onGenerateDragPreview: ({ location, source, nativeSetDragImage }) => {
                const rect = source.element.getBoundingClientRect();
                setCustomNativeDragPreview({
                    nativeSetDragImage,
                    getOffset: preserveOffsetOnSource({
                        element: source.element,
                        input: location.current.input
                    }),
                    render({ container }) {
                        preview = { container, rect, data: source.data };
                        return () => {
                            preview = null;
                        };
                    }
                });
            },
            onDrop: ({ source, location }) => {
                if (location.current.dropTargets.length === 0) {
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

                const targetQK = createIssueListQueryKey(() => ({
                    params: createBoardQueryParams(page.url),
                    projectId,
                    statusId: targetStatusId
                }));
                const targetList =
                    queryClient.getQueryData<InfiniteData<PaginatedList<LocalBoardIssue>>>(
                        targetQK
                    );
                invariant(targetList, 'target list must not be null');
                const sourceData = { statusId: sourceStatusId, statusRank: sourceStatusRank };
                if (target.data['type'] === 'board') {
                    $mutation.mutate({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            statusRank: getRank(
                                null,
                                targetList.pages.find(() => true)?.items.find(() => true)
                                    ?.statusRank || null
                            )
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
                const all = targetList.pages.flatMap((a) => a.items);
                if (edge === 'top') {
                    const previousIndex = all.findIndex((a) => a.id === targetId);
                    $mutation.mutate({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            statusRank: getRank(
                                previousIndex === 0 || previousIndex === -1
                                    ? null
                                    : all[previousIndex - 1].statusRank || null,
                                targetStatusRank || null
                            )
                        }
                    });
                } else {
                    const nextIndex = all.findIndex((a) => a.id === targetId);
                    $mutation.mutate({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            statusRank: getRank(
                                targetStatusRank || null,
                                nextIndex === all.length - 1 || nextIndex === -1
                                    ? null
                                    : all[nextIndex + 1].statusRank || null
                            )
                        }
                    });
                }
            }
        });
    });

    function portal(node: HTMLElement, state: NonNullable<typeof preview>) {
        function update() {
            state.container.appendChild(node);
            state.container.style.top = `${state.rect.top}px`;
            state.container.style.left = `${state.rect.left}px`;
        }

        update();
        return {
            update
        };
    }
</script>

{#snippet errorDescription({ title, from, to }: { title: string; from: string; to: string })}
    An unexpected error has occured while moving <strong>{title}</strong> from
    <strong>{from}</strong>
    to <strong>{to}</strong>.
{/snippet}

<ol class="flex overflow-x-auto overflow-y-hidden w-full">
    {#if $statusListQuery.data}
        {#each $statusListQuery.data.items as status (status.id)}
            <li>
                <ol class="flex h-full w-fit gap-4 p-4">
                    <Board identifier={projectIdentifier} {projectId} {status} />
                </ol>
            </li>
        {/each}
    {/if}
</ol>
{#if preview}
    <div
        use:portal={preview}
        style="width: {preview.rect.width}px; height: calc({preview.rect
            .height}px - 1rem);{navigator.userAgent.includes('Windows')
            ? ' max-width: 280px; max-height: 280px;'
            : ''}"
        class="bg-base-1 z-10 rounded-md text-base-fg-1 px-4 content-center opacity-100 border border-base-border-2"
    >
        <div class="flex gap-1 justify-between items-center text-base-fg-ghost mb-2">
            <p class="leading-none text-sm">
                <small>{projectIdentifier}-{preview.data.orderNumber}</small>
            </p>
            <Icon name="draggable" class="ml-auto h-4" />
        </div>
        <p class="font-medium leading-none">
            {preview.data.title}
        </p>
    </div>
{/if}
