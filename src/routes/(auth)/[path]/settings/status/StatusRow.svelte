<script lang="ts" module>
    function portal(node: HTMLElement, state: { container: HTMLElement; rect: DOMRect }) {
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

<script lang="ts">
    import {
        attachClosestEdge,
        extractClosestEdge,
        type Edge
    } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
    import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
    import {
        draggable,
        dropTargetForElements
    } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import { preserveOffsetOnSource } from '@atlaskit/pragmatic-drag-and-drop/element/preserve-offset-on-source';
    import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
    import { Icon, Row } from '~/lib/components';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import type { LocalWorkspaceStatus } from './+page.server';
    import DeleteStatus from './DeleteStatus.svelte';
    import { toDraggleStatusData, validateDraggleStatusData } from './utils';
    import DropIndicator from '../../projects/[identifier]/issues/_board/DropIndicator.svelte';

    const { status, queryKey }: { status: LocalWorkspaceStatus; queryKey: unknown[] } = $props();

    let edge = $state<Edge | null>(null);
    let preview = $state<{ container: HTMLElement; rect: DOMRect } | null>(null);
    let ref = $state<HTMLTableRowElement>();

    function atlas(node: HTMLElement, state: LocalWorkspaceStatus) {
        state = toDraggleStatusData(state);
        const previous = {
            style: { opacity: node.style.opacity }
        };
        return combine(
            draggable({
                element: node,
                getInitialData: () => state,
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
                    attachClosestEdge(state, {
                        element: node,
                        input,
                        allowedEdges: ['top', 'bottom']
                    }),
                canDrop: ({ source }) => {
                    if (source.element === node) {
                        return false;
                    }
                    return validateDraggleStatusData(source.data).ok;
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

    createEffect(
        () => {
            if (!ref) {
                return;
            }
            return atlas(ref, status);
        },
        () => [ref, status]
    );
</script>

<Row bind:ref class="relative transition ease-in-out">
    <td class="content-center pr-0 text-base-fg-ghost cursor-grab">
        <Icon name="draggable" />
        {#if edge != null && (edge === 'top' || edge === 'bottom')}
            <DropIndicator {edge} gap={0} />
        {/if}
    </td>
    <td class="whitespace-nowrap overflow-hidden text-ellipsis" title={status.value}>
        {status.value}
    </td>
    <td class="whitespace-nowrap overflow-hidden text-ellipsis" title={status.description}>
        {#if status.description}
            {status.description}
        {/if}
    </td>
    <td class="flex flex-wrap gap-2">
        <DeleteStatus {queryKey} {status} />
    </td>
</Row>

{#if preview}
    <div
        use:portal={preview}
        style={navigator.userAgent.includes('Windows')
            ? 'max-width: 280px; max-height: 280px;'
            : undefined}
        class="bg-base-1 rounded px-3 py-1 border border-base-border-2 font-medium"
    >
        {status.value}
    </div>
{/if}
