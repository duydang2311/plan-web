<script lang="ts" module>
    import { StatusCategory } from '~/lib/models/status';
    const categoryClasses = {
        [StatusCategory.Pending]:
            'bg-status-pending/10 border-status-pending/10 data-[dragover]:bg-status-pending/20',
        [StatusCategory.Ongoing]:
            'bg-status-ongoing/10 border-status-ongoing/10 data-[dragover]:bg-status-ongoing/20',
        [StatusCategory.Completed]:
            'bg-status-completed/10 border-status-completed/10 data-[dragover]:bg-status-completed/20',
        [StatusCategory.Canceled]:
            'bg-status-canceled/10 border-status-canceled/10 data-[dragover]:bg-status-canceled/20'
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

    const {
        issueList,
        identifier,
        status
    }: {
        issueList: PaginatedList<LocalBoardIssue>;
        identifier: string;
        projectId: string;
        status: Pick<WorkspaceStatus, 'id' | 'value' | 'category'>;
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

<li
    data-dragover={dragStatus != null ? true : undefined}
    class={clsx(
        'flex w-full flex-col gap-2 rounded-lg border bg-red-500 py-4 transition',
        categoryClasses[status.category]
    )}
    use:atlas={{ id: status.id }}
>
    <h2
        class={[
            'text-p text-base-fg-2 px-4 font-medium tracking-tight',
            categoryTextClasses[status.category]
        ]}
        class:opacity-40={status.id === -1}
    >
        {status.value}
    </h2>
    <div class="flex-1 overflow-hidden">
        <ol class="custom-scrollbar h-full overflow-auto px-2">
            {#each issueList.items.filter((a) => a.id !== draggingIssueId) as issue (issue.id)}
                <li
                    in:tsap={(node, gsap) =>
                        gsap.from(node, {
                            overflow: 'hidden',
                            height: 0,
                            opacity: 0,
                            scale: 0,
                            duration: 0.15,
                            clearProps: 'overflow,height,opacity,scale',
                            ease: 'power2.out'
                        })}
                    out:tsap={(node, gsap) =>
                        gsap.to(node, {
                            overflow: 'hidden',
                            height: 0,
                            opacity: 0,
                            scale: 0,
                            duration: 0.15,
                            ease: 'power2.in'
                        })}
                >
                    <BoardIssue {identifier} {issue} />
                </li>
            {/each}
        </ol>
    </div>
</li>
