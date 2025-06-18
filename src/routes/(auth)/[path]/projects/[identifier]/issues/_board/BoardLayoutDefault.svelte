<script lang="ts">
    import { page } from '$app/state';
    import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
    import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
    import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
    import { pipe } from '@baetheus/fun/fn';
    import { onMount } from 'svelte';
    import invariant from 'tiny-invariant';
    import { toast } from '~/lib/components';
    import { IconDraggable } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { errorCodes } from '~/lib/models/errors';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { TE } from '~/lib/utils/functional';
    import { compareRank, getRank } from '~/lib/utils/ranking';
    import { type AsyncRef } from '~/lib/utils/runes.svelte';
    import { attempt } from '~/lib/utils/try';
    import type { LocalBoardIssue, LocalWorkspaceStatus } from '../+page.server';
    import { createBoardQueryParams } from '../utils';
    import Board from './Board.svelte';
    import BoardSkeleton from './BoardSkeleton.svelte';
    import { validateDraggableIssueData } from './utils';

    const {
        statusList,
        issueListsRef,
        projectId,
        projectIdentifier
    }: {
        statusList: PaginatedList<LocalWorkspaceStatus>;
        issueListsRef: AsyncRef<Record<PropertyKey, PaginatedList<LocalBoardIssue>>>;
        projectId: string;
        projectIdentifier: string;
    } = $props();
    const { api } = useRuntime();
    let preview = $state.raw<{
        container: HTMLElement;
        rect: DOMRect;
        data: Record<string, unknown>;
    } | null>(null);
    const loadingMap = new Map<number, boolean>();

    const dragIssue = async ({
        issueId,
        source,
        target
    }: {
        issueId: string;
        source: { statusId: number; statusRank: string };
        target: {
            statusRank: string;
            statusId: number;
        };
    }) => {
        const old = issueListsRef.value;
        if (!old) {
            return;
        }

        const patch = api.patch(`issues/${issueId}`, {
            body: { patch: { statusRank: target.statusRank, statusId: target.statusId } }
        });
        const sourceList = old[source.statusId];
        const targetList = old[target.statusId];

        invariant(sourceList, 'source list must not be null');
        invariant(targetList, 'target list must not be null');

        const sourceIssue = sourceList.items.find((a) => a.id === issueId);
        invariant(sourceIssue, 'source issue must not be null');

        if (source.statusId === target.statusId) {
            issueListsRef.value = {
                ...old,
                [source.statusId]: paginatedList({
                    items: sourceList.items
                        .map((a) =>
                            a.id === issueId ? { ...a, statusRank: target.statusRank } : a
                        )
                        .toSorted((a, b) => compareRank(a.statusRank, b.statusRank)),
                    totalCount: sourceList.totalCount
                })
            };
        } else {
            issueListsRef.value = {
                ...old,
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
                            status: sourceIssue.status
                                ? { ...sourceIssue.status, id: target.statusId }
                                : undefined
                        }
                    ].toSorted((a, b) => compareRank(a.statusRank, b.statusRank)),
                    totalCount: targetList.totalCount + 1
                })
            };
        }

        const tryPatch = await pipe(
            TE.fromPromise(() => patch)(),
            TE.flatMap((a) => (a.ok ? TE.right(a) : TE.left('http')))
        )();
        if (tryPatch.tag === 'Left') {
            const sourceStatus =
                sourceIssue.status?.id == null
                    ? null
                    : statusList.items.find((a) => a.id === sourceIssue.status!.id);
            const targetStatus =
                target.statusId === -1
                    ? null
                    : statusList.items.find((a) => a.id === target.statusId!);
            toast({
                type: 'negative',
                body: errorDescription,
                bodyProps: {
                    title: sourceIssue.title,
                    from: sourceStatus?.value ?? 'No status',
                    to: targetStatus?.value ?? 'No status'
                }
            });
            issueListsRef.value = old;
            return;
        }

        if (page.url.searchParams.has('q')) {
            return;
        }
        if (source.statusId === target.statusId) {
            refetch([source.statusId]);
        } else {
            refetch([source.statusId, target.statusId]);
        }
    };

    const refetch = async (statusIds: number[]) => {
        const tryGet = await TE.fromPromise(() =>
            Promise.all(
                statusIds.map(async (a) => {
                    let size = issueListsRef.value?.[a].items.length;
                    if (size == null || size < 20) {
                        size = 20;
                    }
                    const params = createBoardQueryParams(page.url);
                    const response = await api.get('issues', {
                        query: {
                            ...params,
                            projectId,
                            statusId: a === -1 ? null : a,
                            nullStatusId: a === -1
                        }
                    });
                    return response.json<PaginatedList<LocalBoardIssue>>();
                })
            )
        )()();
        if (tryGet.tag === 'Left') {
            return;
        }

        issueListsRef.value = {
            ...issueListsRef.value,
            ...Object.fromEntries(statusIds.map((a, i) => [a, tryGet.right[i]]))
        };
    };

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
                if (location.current.dropTargets.length === 0 || issueListsRef.value == null) {
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

                const targetList = issueListsRef.value[targetStatusId];
                invariant(targetList, 'target list must not be null');
                const sourceData = { statusId: sourceStatusId, statusRank: sourceStatusRank };
                if (target.data['type'] === 'board') {
                    dragIssue({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            statusRank: getRank(null, targetList.items[0]?.statusRank || null)
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
                    const previousIndex = targetList.items.findIndex((a) => a.id === targetId);
                    dragIssue({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            statusRank: getRank(
                                previousIndex === 0 || previousIndex === -1
                                    ? null
                                    : targetList.items[previousIndex - 1].statusRank || null,
                                targetStatusRank || null
                            )
                        }
                    });
                } else {
                    const nextIndex = targetList.items.findIndex((a) => a.id === targetId);
                    dragIssue({
                        issueId: source.data['id'],
                        source: sourceData,
                        target: {
                            statusId: targetStatusId,
                            statusRank: getRank(
                                targetStatusRank || null,
                                nextIndex === targetList.items.length - 1 || nextIndex === -1
                                    ? null
                                    : targetList.items[nextIndex + 1].statusRank || null
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

    const onLoadMore = async (statusId: number) => {
        if (loadingMap.has(statusId)) {
            return;
        }

        loadingMap.set(statusId, true);
        const issueList = issueListsRef.value?.[statusId];
        if (!issueList) {
            loadingMap.delete(statusId);
            return;
        }

        const getAttempt = await attempt.promise(() =>
            api.get('issues', {
                query: {
                    projectId,
                    statusId: statusId === -1 ? null : statusId,
                    nullStatusId: statusId === -1,
                    select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,StartTime,EndTime,StatusRank,Status.Id,Status.Color,Status.Category,Status.Value,Status.Rank,Priority,Author.Email,Author.Profile.Name,Author.Profile.DisplayName,Author.Profile.Image,PreviewDescription,Milestone.Id,Milestone.Title,Milestone.Emoji,Milestone.Color',
                    order: 'StatusRank,OrderNumber',
                    statusRankCursor: issueList.items.at(-1)?.statusRank ?? null
                }
            })
        )(errorCodes.fromFetch);
        if (getAttempt.failed || !getAttempt.data.ok) {
            toast({
                type: 'negative',
                header: 'Failed to load more issues',
                body: 'Something went wrong while fetching more issues from the server.',
                footer: `Error code: ${getAttempt.failed ? getAttempt.error : getAttempt.data.status}.`
            });
            loadingMap.delete(statusId);
            return;
        }

        const jsonAttempt = await attempt.promise(() =>
            getAttempt.data.json<PaginatedList<LocalBoardIssue>>()
        )(errorCodes.fromJson);
        if (jsonAttempt.failed) {
            toast({
                type: 'negative',
                header: 'Failed to load more issues',
                body: 'Something went wrong while parsing issues.',
                footer: `Error code: ${jsonAttempt.error}.`
            });
            loadingMap.delete(statusId);
            return;
        }

        issueListsRef.value = {
            ...issueListsRef.value,
            [statusId]: paginatedList({
                items: [...issueList.items, ...jsonAttempt.data.items],
                totalCount: jsonAttempt.data.totalCount
            })
        };
        // TODO: status rank collision can cause this bug
        if (jsonAttempt.data.items.length > 0) {
            loadingMap.delete(statusId);
        }
    };
</script>

{#snippet errorDescription({ title, from, to }: { title: string; from: string; to: string })}
    An unexpected error has occured while moving <strong>{title}</strong> from
    <strong>{from}</strong>
    to <strong>{to}</strong>.
{/snippet}

<div class="flex h-full overflow-x-auto overflow-y-hidden px-4 pb-1">
    <ol
        class="grid h-full auto-cols-[minmax(24rem,1fr)] grid-flow-col gap-2"
        class:animate-pulse={issueListsRef.loading.immediate}
    >
        {#each statusList.items as status (status.id)}
            {@const list = issueListsRef.value?.[status.id]}
            {#if status.id !== -1 || (list != null && list.totalCount > 0)}
                <li class="min-h-0">
                    <ol class="h-full">
                        {#if list == null}
                            <BoardSkeleton />
                        {:else}
                            <Board
                                issueList={list}
                                identifier={projectIdentifier}
                                {projectId}
                                {status}
                                {onLoadMore}
                            />
                        {/if}
                    </ol>
                </li>
            {/if}
        {/each}
    </ol>
</div>
{#if preview}
    <div
        use:portal={preview}
        style="width: {preview.rect.width}px; {navigator.userAgent.includes('Windows')
            ? ' max-width: 280px; max-height: 280px;'
            : ''}"
        class="bg-base-1 dark:bg-base-3 text-base-fg-1 border-base-border-2 z-10 content-center rounded-md border p-4 px-4 opacity-100"
    >
        <div class="text-base-fg-ghost mb-2 flex items-center justify-between gap-1">
            <p class="text-sm leading-none">
                <small>{projectIdentifier}-{preview.data.orderNumber}</small>
            </p>
            <IconDraggable class="ml-auto h-4" />
        </div>
        <p class="font-medium leading-none">
            {preview.data.title}
        </p>
        <p class="mt-4 line-clamp-3">{preview.data.previewDescription}</p>
    </div>
{/if}
