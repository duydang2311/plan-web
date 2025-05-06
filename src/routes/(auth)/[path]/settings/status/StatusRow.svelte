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
    import { Row } from '~/lib/components';
    import { IconDraggable } from '~/lib/components/icons';
    import { watch } from '~/lib/utils/runes.svelte';
    import DropIndicator from '../../projects/[identifier]/issues/_board/DropIndicator.svelte';
    import type { LocalWorkspaceStatus } from './+page.server';
    import DeleteStatus from './DeleteStatus.svelte';
    import { toDraggleStatusData, validateDraggleStatusData } from './utils';

    const {
        status,
        canUpdate,
        canDelete
    }: {
        status: LocalWorkspaceStatus;
        canUpdate: boolean;
        canDelete: boolean;
    } = $props();

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

    watch(() => [ref, canUpdate])(() => {
        if (!ref || !canUpdate) {
            return;
        }
        return atlas(ref, status);
    });
</script>

<Row bind:ref class="relative transition">
    {#if canUpdate}
        <td class="text-base-fg-ghost cursor-grab content-center pr-0">
            <IconDraggable />
            {#if edge != null && (edge === 'top' || edge === 'bottom')}
                <DropIndicator {edge} gap={0} />
            {/if}
        </td>
    {/if}
    <td
        class="overflow-hidden text-ellipsis whitespace-nowrap"
        class:col-span-2={!canUpdate}
        title={status.value}
    >
        {status.value}
    </td>
    <td class="overflow-hidden text-ellipsis whitespace-nowrap" title={status.description}>
        {#if status.description}
            {status.description}
        {/if}
    </td>
    {#if canDelete}
        <td class="flex flex-wrap items-center justify-end gap-2">
            <DeleteStatus {status} />
        </td>
    {/if}
</Row>

{#if preview}
    <div
        use:portal={preview}
        style={navigator.userAgent.includes('Windows')
            ? 'max-width: 280px; max-height: 280px;'
            : undefined}
        class="bg-base-1 border-base-border-2 rounded border px-3 py-1 font-medium"
    >
        {status.value}
    </div>
{/if}
