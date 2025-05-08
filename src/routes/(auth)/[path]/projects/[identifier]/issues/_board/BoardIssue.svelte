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
    import { Resize } from '@cloudinary/url-gen/actions';
    import clsx from 'clsx';
    import { Avatar, Link, RelativeTime } from '~/lib/components';
    import { IconDraggable } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { getPriorityLabel } from '~/lib/models/issue';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import type { LocalBoardIssue } from '../+page.server';
    import DropIndicator from './DropIndicator.svelte';
    import { toDraggableIssueData, validateDraggableIssueData } from './utils';

    interface Props {
        identifier: string;
        issue: LocalBoardIssue;
    }

    const { identifier, issue }: Props = $props();
    const { cloudinary } = useRuntime();
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
            'shadow-xs relative w-full cursor-grab rounded-md p-4 transition duration-75',
            dragStatus != null ? dragStatusClasses[dragStatus] : 'bg-base-1 dark:bg-base-2'
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
        <p class="font-semibold leading-none">
            <Link
                href="/{page.params.path}/projects/{page.params
                    .identifier}/issues/{issue.orderNumber}"
                class="text-base-fg-1"
            >
                {issue.title}
            </Link>
        </p>
        {#if issue.previewDescription != null && issue.previewDescription.length > 0}
            <p class="c-label mt-4 line-clamp-3 text-pretty">
                {issue.previewDescription}
            </p>
        {/if}
        <div class="mt-4 flex items-center justify-between gap-4 text-sm">
            <div
                class="bg-negative-1 text-negative-fg-1 border-negative-border rounded-full border px-2"
            >
                {getPriorityLabel(issue.priority)}
            </div>
            <span class="c-label">
                <RelativeTime time={issue.createdTime} />
            </span>
        </div>
        <div class="border-t-base-border-3 mt-4 flex items-center gap-2 border-t pt-2">
            <Avatar
                seed={issue.author.profile?.name ?? issue.author.email}
                src={imageFromAsset(cloudinary)(issue.author.profile?.image)
                    ?.resize(Resize.fill(64))
                    .toURL()}
                class="size-avatar-md"
            />
            <div>
                {#if issue.author.profile}
                    <p>{issue.author.profile.displayName}</p>
                {/if}
                <p class="c-label">{issue.author.email}</p>
            </div>
        </div>
    </div>
</div>
