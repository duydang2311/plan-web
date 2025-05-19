<script lang="ts">
    import { enhance } from '$app/forms';
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { omit } from '@baetheus/fun/record';
    import { toStore } from 'svelte/store';
    import { Button, DialogBuilder, IconButton, Input } from '~/lib/components';
    import { IconCheck, IconSparkles, IconTrash, IconXMark } from '~/lib/components/icons';
    import { dialog, dialogOverlay, tsap } from '~/lib/utils/transition';

    const { issueId }: { issueId: string } = $props();
    const todos = $derived(page.state.importChecklistTodos);
    const open = toStore(
        () => todos != null,
        (a) => {
            if (!a) {
                replaceState('', omit('importChecklistTodos')(page.state));
            }
        }
    );
</script>

<DialogBuilder
    options={{
        open,
        forceVisible: true
    }}
>
    {#snippet children(builder)}
        <div
            {...builder.overlay}
            use:builder.overlay.action
            class="c-dialog--overlay"
            in:tsap={dialogOverlay.in()}
            out:tsap={dialogOverlay.out()}
        ></div>
        <div
            {...builder.content}
            use:builder.content.action
            class="c-dialog--wrapper"
            in:tsap={dialog.in()}
            out:tsap={dialog.out()}
        >
            <div class="c-dialog">
                <div class="flex items-center justify-between gap-4">
                    <h2 {...builder.title} use:builder.title.action class="capitalize">
                        Import generated checklist
                    </h2>
                    <IconSparkles class="text-base-fg-1 size-8" />
                </div>
                <p class="c-text-secondary text-pretty">
                    Review and import all the items from your generated checklist. You can make
                    adjustments before adding them to your task.
                </p>
                <form method="post" action="?/create_checklist_item_todo_batch" class="mt-8" use:enhance={(e) => {
                    return async (e) => {
                        await e.update();
                    }
                }}>
                    <input type="hidden" name="parentIssueId" value={issueId} />
                    <ul class="grid grid-cols-[auto_1fr] gap-2 space-y-1">
                        {#each todos! as todo, i (todo)}
                            <li class="col-span-full grid grid-cols-subgrid items-center gap-4">
                                <IconButton
                                    type="button"
                                    variant="negative"
                                    onclick={() => {
                                        replaceState('', {
                                            ...page.state,
                                            importChecklistTodos: todos
                                                ? [...todos.slice(0, i), ...todos.slice(i + 1)]
                                                : []
                                        });
                                    }}
                                >
                                    <IconTrash />
                                </IconButton>
                                <Input type="text" name="contents" value={todo} />
                            </li>
                        {/each}
                    </ul>
                    <div class="mt-4 flex justify-end gap-2 *:w-fit">
                        <Button
                            {...builder.close}
                            type="button"
                            variant="base"
                            outline
                            class="flex items-center gap-2"
                            action={builder.close.action}
                        >
                            <IconXMark />
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            class="flex items-center gap-2"
                            disabled={todos == null || todos.length === 0}
                        >
                            <IconCheck />
                            Import
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    {/snippet}
</DialogBuilder>
