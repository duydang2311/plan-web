<script lang="ts" module>
    const dragStatusClasses = {
        dragover: 'bg-base-1 border-primary-border/60'
    };
</script>

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
    import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
    import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
    import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/types';
    import clsx from 'clsx';
    import Icon from '~/lib/components/Icon.svelte';
    import type { Issue } from '~/lib/models/issue';
    import DropIndicator from './DropIndicator.svelte';
    import { toDraggableIssueData, validateDraggableIssueData } from './utils';
    import { Link } from '~/lib/components';
    import { page } from '$app/stores';

    interface Props {
        identifier: string;
        issue: Issue;
    }

    const { identifier, issue }: Props = $props();
    let edge = $state<Edge | null>(null);
    let dragStatus = $state<'dragover' | null>(null);
    let preview = $state<{ container: HTMLElement; rect: DOMRect } | null>(null);

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
                    },
                    onGenerateDragPreview: ({ location, source, nativeSetDragImage }) => {
                        const rect = source.element.getBoundingClientRect();

                        setCustomNativeDragPreview({
                            nativeSetDragImage,
                            getOffset: preserveOffsetOnSource({
                                element: node,
                                input: location.current.input
                            }),
                            render({ container }) {
                                preview = { container, rect };
                                return () => {
                                    preview = null;
                                };
                            }
                        });
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

<div class="py-1" use:atlas={issue}>
    <div
        class={clsx(
            'relative w-full p-4 rounded-md border cursor-grab transition ease-in-out duration-75',
            dragStatus != null ? dragStatusClasses[dragStatus] : 'bg-base-2/40 border-base-border-2'
        )}
    >
        {#if edge != null && (edge === 'top' || edge === 'bottom')}
            <DropIndicator {edge} gap={8} radius={8} stroke={2} />
        {/if}
        <div class="flex gap-1 justify-between items-center text-base-fg-ghost mb-2">
            <p class="leading-none text-sm">
                <small>{identifier}-{issue.orderNumber}</small>
            </p>
            <Icon name="draggable" class="ml-auto h-4" />
        </div>
        <p class="font-medium leading-none">
            <Link href="/{$page.params['path']}/issues/{issue.orderNumber}">
                {issue.title}
            </Link>
        </p>
    </div>
</div>

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
                <small>{identifier}-{issue.orderNumber}</small>
            </p>
            <Icon name="draggable" class="ml-auto h-4" />
        </div>
        <p class="font-medium leading-none">
            {issue.title}
        </p>
    </div>
{/if}
