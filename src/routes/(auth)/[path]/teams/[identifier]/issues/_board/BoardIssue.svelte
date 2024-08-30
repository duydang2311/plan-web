<script lang="ts">
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
    import Icon from '~/lib/components/Icon.svelte';
    import type { Issue } from '~/lib/models/issue';
    import type { PageData } from '../$types';
    import DropIndicator from './DropIndicator.svelte';
    import { toDraggableIssueData, validateDraggableIssueData } from './utils';
    import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';

    interface Props {
        identifier: string;
        issue: Issue;
    }

    const { identifier, issue }: Props = $props();
    let edge = $state<Edge | null>(null);

    function atlas(node: HTMLElement, state: Issue) {
        let cleanup: CleanupFn | undefined = undefined;

        function update(state: Issue) {
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
                        edge = extractClosestEdge(self.data);
                    },
                    onDrag: ({ self }) => {
                        const newEdge = extractClosestEdge(self.data);
                        if (edge !== newEdge) {
                            edge = newEdge;
                        }
                    },
                    onDragLeave: () => {
                        edge = null;
                    },
                    onDrop: () => {
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

<div class="py-2" use:atlas={issue}>
    <div
        class="relative w-full px-4 py-2 bg-base-1 rounded-lg border border-base-border shadow-sm cursor-grab"
    >
        {#if edge != null}
            <DropIndicator {edge} gap={'16px'} />
        {/if}
        <div class="flex gap-1 justify-between items-center text-base-fg-ghost mb-1">
            <p class="font-bold">
                <small>{identifier}-{issue.orderNumber}</small>
            </p>
            <Icon name="draggable" class="ml-auto h-4" />
        </div>
        <p class="text-h5 font-medium">
            {issue.title}
        </p>
    </div>
</div>
