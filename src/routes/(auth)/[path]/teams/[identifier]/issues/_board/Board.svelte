<script lang="ts" module>
    const dragStatusClasses = {
        dragover: 'bg-base-3 border-primary-border/20'
    };
</script>

<script lang="ts">
    import type { CleanupFn } from '@atlaskit/pragmatic-drag-and-drop/dist/types/internal-types';
    import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
    import clsx from 'clsx';
    import type { Issue } from '~/lib/models/issue';
    import type { Status } from '~/lib/models/status';
    import { tsap } from '~/lib/utils/transition';
    import BoardIssue from './BoardIssue.svelte';
    import { validateDraggableIssueData } from './utils';

    const {
        identifier,
        issues,
        status
    }: {
        identifier: string;
        issues: readonly Issue[];
        status: Pick<Status, 'id' | 'value' | 'color'>;
    } = $props();
    let dragStatus = $state<'dragover' | null>(null);

    function atlas(node: HTMLElement, state: Pick<Status, 'id'>) {
        let cleanup: CleanupFn | undefined = undefined;

        update(state);
        function update(state: Pick<Status, 'id'>) {
            cleanup?.();
            cleanup = dropTargetForElements({
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
            });
        }

        return {
            update,
            destroy: cleanup
        };
    }
</script>

<li
    class={clsx(
        'min-w-96 flex flex-col py-4 rounded-lg transition ease-in-out duration-75',
        dragStatus != null && dragStatusClasses[dragStatus]
    )}
    use:atlas={{ id: status.id }}
>
    <h2 class="text-h5 px-4">{status.value}</h2>
    <div class="scrollbar-3 grow overflow-x-hidden overflow-y-auto pt-2">
        <ol class="h-full px-4">
            {#each issues as issue (issue.id)}
                <li
                    in:tsap={(node, gsap) =>
                        gsap.from(node, {
                            overflow: 'hidden',
                            height: 0,
                            opacity: 0,
                            scale: 0,
                            duration: 0.15,
                            ease: 'power1.out',
                            clearProps: 'overflow,height,opacity'
                        })}
                    out:tsap={(node, gsap) =>
                        gsap.to(node, {
                            overflow: 'hidden',
                            height: 0,
                            opacity: 0,
                            duration: 0.15,
                            ease: 'power1.in',
                            clearProps: 'overflow,height,opacity'
                        })}
                >
                    <BoardIssue {identifier} {issue} />
                </li>
            {/each}
        </ol>
    </div>
</li>
