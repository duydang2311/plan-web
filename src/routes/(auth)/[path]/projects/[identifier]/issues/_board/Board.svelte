<script lang="ts" module>
    import { StatusCategory } from '~/lib/models/status';
    const categoryClasses = {
        [StatusCategory.Pending]:
            'bg-base-3 dark:bg-base-1 border-base-border-2 data-[dragover]:bg-status-pending/20',
        [StatusCategory.Ongoing]:
            'bg-base-3 dark:bg-base-1 border-base-border-2 data-[dragover]:bg-status-ongoing/20',
        [StatusCategory.Completed]:
            'bg-base-3 dark:bg-base-1 border-base-border-2 data-[dragover]:bg-status-completed/20',
        [StatusCategory.Canceled]:
            'bg-base-3 dark:bg-base-1 border-base-border-2 data-[dragover]:bg-status-canceled/20'
    };
    const categoryTextClasses = {
        [StatusCategory.Pending]: 'text-status-pending',
        [StatusCategory.Ongoing]: 'text-status-ongoing',
        [StatusCategory.Completed]: 'text-status-completed',
        [StatusCategory.Canceled]: 'text-status-canceled'
    };
</script>

<script lang="ts">
    import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
    import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
    import {
        dropTargetForElements,
        monitorForElements
    } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import clsx from 'clsx';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { Status, WorkspaceStatus } from '~/lib/models/status';
    import { tsap } from '~/lib/utils/transition';
    import type { LocalBoardIssue } from '../+page.server';
    import BoardIssue from './BoardIssue.svelte';
    import { validateDraggableIssueData } from './utils';
    import { Virtualizer } from 'virtua/svelte';

    const {
        issueList,
        identifier,
        status,
        onLoadMore
    }: {
        issueList: PaginatedList<LocalBoardIssue>;
        identifier: string;
        projectId: string;
        status: Pick<WorkspaceStatus, 'id' | 'value' | 'category'>;
        onLoadMore: (statusId: number) => void;
    } = $props();
    let dragStatus = $state<'dragover' | null>(null);
    let draggingIssueId = $state.raw<string | null>(null);

    function atlas(node: HTMLElement, state: Pick<Status, 'id'>) {
        let cleanup: CleanupFn | undefined = undefined;

        update(state);
        function update(state: Pick<Status, 'id'>) {
            cleanup?.();
            cleanup = combine(
                dropTargetForElements({
                    element: node,
                    getData: () => ({ type: 'board', statusId: state.id }),
                    canDrop: ({ source }) => {
                        const validation = validateDraggableIssueData(source.data);
                        return validation.ok && (validation.data.statusId ?? -1) !== state.id;
                    },
                    onDragEnter: () => {
                        dragStatus = 'dragover';
                    },
                    onDragLeave: () => {
                        dragStatus = null;
                    },
                    onDrop: () => {
                        dragStatus = null;
                    }
                }),
                monitorForElements({
                    canMonitor: ({ source }) => {
                        const validation = validateDraggableIssueData(source.data);
                        return validation.ok && (validation.data.statusId ?? -1) === state.id;
                    },
                    onDragStart: ({ source }) => {
                        draggingIssueId = source.data.id as string;
                    },
                    onDrop: () => {
                        draggingIssueId = null;
                    }
                })
            );
        }

        return {
            update,
            destroy: cleanup
        };
    }
</script>

<div class="flex h-full w-full flex-col gap-2">
    <h2
        class={[
            'text-p text-base-fg-2 font-semibold tracking-tight',
            categoryTextClasses[status.category]
        ]}
    >
        {status.value}
    </h2>
    <li
        data-dragover={dragStatus != null ? true : undefined}
        class={clsx(
            'flex w-full flex-1 grow flex-col overflow-hidden rounded-lg border py-1 transition',
            categoryClasses[status.category]
        )}
        use:atlas={{ id: status.id }}
    >
        <div class="h-full overflow-hidden">
            <ol
                class="custom-scrollbar max-h-full overflow-auto rounded-lg px-1"
            >
                <Virtualizer
                    data={[...issueList.items, { id: 'load-more' } as const]}
                    getKey={(a) => a.id}
                >
                    {#snippet children(issue)}
                        {#if issue.id === 'load-more'}
                            <li
                                {@attach () => {
                                    if (issueList.items.length >= issueList.totalCount) {
                                        return;
                                    }
                                    onLoadMore(status.id);
                                }}
                            ></li>
                        {:else}
                            {@const isDragging = issue.id === draggingIssueId}
                            <li
                                in:tsap={(node, gsap) =>
                                    gsap.from(node, {
                                        overflow: 'hidden',
                                        opacity: 0,
                                        scale: 0,
                                        duration: 0.15,
                                        clearProps: 'overflow,opacity,scale',
                                        ease: 'power2.out'
                                    })}
                                class={isDragging
                                    ? 'border-base-border-2 rounded-xl border-2 border-dashed'
                                    : undefined}
                            >
                                <div
                                    class={isDragging ? 'pointer-events-none invisible' : undefined}
                                >
                                    <BoardIssue {identifier} issue={issue as LocalBoardIssue} />
                                </div>
                            </li>
                        {/if}
                    {/snippet}
                </Virtualizer>
            </ol>
        </div>
    </li>
</div>
