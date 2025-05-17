<script lang="ts">
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';
    import { Button, IconButton, Input, Link } from '~/lib/components';
    import { Checkbox } from '~/lib/components/checkbox';
    import { IconCheck, IconUnlink, IconXMark } from '~/lib/components/icons';
    import { ChecklistItemKind } from '~/lib/models/checklist';
    import type { LocalChecklistItem } from './+page.server';
    import ChecklistItemActionMenu from './ChecklistItemActionMenu.svelte';
    import { toStore } from 'svelte/store';
    import { StatusCategory } from '~/lib/models/status';
    import { page } from '$app/state';

    const {
        item,
        isEditing,
        onEdit,
        onEditSubmit,
        onEditCancel,
        onDeleteSubmit,
        onCompletedChange
    }: {
        item: LocalChecklistItem;
        isEditing: boolean;
        onEdit: (item: LocalChecklistItem) => void;
        onEditSubmit: (
            item: LocalChecklistItem,
            input: Parameters<SubmitFunction>[0]
        ) => ReturnType<SubmitFunction>;
        onEditCancel: (item: LocalChecklistItem) => void;
        onDeleteSubmit: (
            item: LocalChecklistItem,
            ...args: Parameters<SubmitFunction>
        ) => ReturnType<SubmitFunction>;
        onCompletedChange: (item: LocalChecklistItem, completed: boolean) => boolean;
    } = $props();
</script>

{#if item.kind === ChecklistItemKind.Todo}
    <li
        data-completed={item.completed ? true : undefined}
        class={[
            'group col-span-full grid grid-cols-subgrid items-center gap-4 transition duration-75 first:rounded-t-md last:rounded-b-md',
            item.completed ? 'bg-primary-1/5' : !isEditing ? 'hover:bg-base-hover' : undefined,
            isEditing ? 'py-1' : 'px-4 py-2'
        ]}
    >
        {#if isEditing}
            <form
                method="post"
                action="?/patch_checklist_item"
                class="flex w-full gap-2"
                use:enhance={(e) => {
                    return onEditSubmit(item, e);
                }}
            >
                <input type="hidden" name="id" value={item.id} />
                <Input
                    type="text"
                    name="content"
                    value={item.content}
                    size="sm"
                    class="w-full max-w-full grow rounded-none border-0 border-b bg-transparent p-0 shadow-none"
                />
                <Button
                    type="submit"
                    variant="primary"
                    class="flex w-fit items-center gap-2 text-sm"
                >
                    <IconCheck />
                    <span>Save</span>
                </Button>
                <Button
                    type="button"
                    variant="base"
                    class="flex w-fit items-center gap-2 text-sm"
                    onclick={() => onEditCancel(item)}
                >
                    <IconXMark />
                    <span>Cancel</span>
                </Button>
            </form>
        {:else}
            <Checkbox
                variant="primary"
                class={[
                    'data-[state=checked]:bg-primary-1 border-primary-border data-[state=checked]:text-primary-fg-1 size-4 shrink-0 border',
                    !item.completed &&
                        'opacity-0 transition duration-75 focus-visible:opacity-100 group-hover:opacity-100'
                ]}
                options={{
                    checked: toStore(
                        () => item.completed!,
                        () => {}
                    ),
                    onCheckedChange: ({ next }) => {
                        return onCompletedChange(item, next as boolean);
                    }
                }}
            />
            <span class:line-through={item.completed}>
                {item.content}
            </span>
            {#if item.id != null}
                <ChecklistItemActionMenu
                    itemId={item.id}
                    onEdit={() => onEdit(item)}
                    onDeleteSubmit={(e) => onDeleteSubmit(item, e)}
                />
            {/if}
        {/if}
    </li>
{:else if item.kind === ChecklistItemKind.SubIssue && item.subIssue}
    {@const completed = item.subIssue.status?.category === StatusCategory.Completed}
    <li
        class={[
            'group col-span-full grid grid-cols-subgrid items-center gap-4 px-4 py-2 transition duration-75 first:rounded-t-md last:rounded-b-md',
            completed ? 'bg-primary-1/5' : 'hover:bg-base-hover'
        ]}
    >
        <span class="c-text-secondary" class:text-primary-1={completed} class:font-bold={completed}>
            {item.subIssue.status?.value ?? 'No status'}
        </span>
        <Link
            href="/{page.params.path}/projects/{item.subIssue.project.identifier}/issues/{item
                .subIssue.orderNumber}"
            class={['font-normal', completed ? 'line-through' : undefined]}
        >
            {item.subIssue.title}
        </Link>
        {#if item.id != null}
            <form
                method="post"
                action="?/delete_checklist_item"
                use:enhance={(e) => onDeleteSubmit(item, e)}
            >
                <input type="hidden" name="id" value={item.id} />
                <IconButton type="submit" variant="negative" title="Unlink subtask">
                    <IconUnlink />
                </IconButton>
            </form>
        {/if}
    </li>
{/if}
