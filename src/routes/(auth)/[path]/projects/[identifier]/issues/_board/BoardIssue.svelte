<script lang="ts" module>
    const dragStatusClasses = {
        dragover: 'bg-base-1 border-primary-border/60'
    };
</script>

<script lang="ts">
    import { page } from '$app/state';
    import {
        attachClosestEdge,
        type Edge,
        extractClosestEdge
    } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
    import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
    import {
        draggable,
        dropTargetForElements
    } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types';
    import clsx from 'clsx';
    import { Link } from '~/lib/components';
    import type { LocalBoardIssue } from '../+page.server';
    import DropIndicator from './DropIndicator.svelte';
    import { toDraggableIssueData, validateDraggableIssueData } from './utils';
    import { IconDraggable } from '~/lib/components/icons';

    interface Props {
        identifier: string;
        issue: LocalBoardIssue;
    }

    const { identifier, issue }: Props = $props();
    let edge = $state.raw<Edge | null>(null);
    let dragStatus = $state.raw<'dragover' | null>(null);

    function atlas(node: HTMLElement, state: LocalBoardIssue) {
        let cleanup: CleanupFn | undefined = undefined;

        function update(state: LocalBoardIssue) {
            cleanup?.();
            const previous = {
                style: { opacity: node.style.opacity }
            };
            cleanup = combine(
                draggable({
                    element: node,
                    getInitialData: () => toDraggableIssueData(state),
                    onDragStart: () => {
                        previous.style.opacity = node.style.opacity;
                        node.style.opacity = '0.4';
                    },
                    onDrop: () => {
                        node.style.opacity = previous.style.opacity;
                    }
                }),
                dropTargetForElements({
                    element: node,
                    getData: ({ input }) =>
                        attachClosestEdge(toDraggableIssueData(state), {
                            element: node,
                            input,
                            allowedEdges: ['top', 'bottom']
                        }),
                    canDrop: ({ source }) => {
                        if (source.element === node) {
                            return false;
                        }
                        return validateDraggableIssueData(source.data).ok;
                    },
                    onDragEnter: ({ self }) => {
                        dragStatus = 'dragover';
                        edge = extractClosestEdge(self.data);
                    },
                    onDrag: ({ self }) => {
                        const newEdge = extractClosestEdge(self.data);
                        if (edge !== newEdge) {
                            edge = newEdge;
                        }
                    },
                    onDragLeave: () => {
                        dragStatus = null;
                        edge = null;
                    },
                    onDrop: () => {
                        dragStatus = null;
                        edge = null;
                    }
                })
            );
        }

        update(state);

        return {
            update,
            destroy: cleanup
        };
    }
</script>

<div class="py-1" use:atlas={issue}>
    <div
        class={clsx(
            'relative w-full cursor-grab rounded-md border p-4 transition duration-75',
            dragStatus != null ? dragStatusClasses[dragStatus] : 'bg-base-2/40 border-base-border-2'
        )}
    >
        {#if edge != null && (edge === 'top' || edge === 'bottom')}
            <DropIndicator {edge} gap={8} radius={8} stroke={2} />
        {/if}
        <div class="text-base-fg-ghost mb-2 flex items-center justify-between gap-1">
            <p class="text-sm leading-none">
                <small>{identifier}-{issue.orderNumber}</small>
            </p>
            <IconDraggable class="ml-auto h-4" />
        </div>
        <p class="font-medium leading-none">
            <Link href="/{page.params['path']}/issues/{issue.orderNumber}">
                {issue.title}
            </Link>
        </p>
    </div>
</div>
