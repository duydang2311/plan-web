<script lang="ts">
    import { SvelteSet } from 'svelte/reactivity';
    import { Button, toast } from '~/lib/components';
    import { IconLink, IconPlus } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import {
        stringifyActionFailureErrors,
        validateActionFailureData
    } from '~/lib/utils/kit.client';
    import type { AsyncRef } from '~/lib/utils/runes.svelte';
    import type { ActionData, SubmitFunction } from './$types';
    import type { LocalChecklistItem } from './+page.server';
    import AddToDo from './AddToDo.svelte';
    import ChecklistItem from './ChecklistItem.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { errorCodes } from '~/lib/models/errors';
    import { attempt } from '~/lib/utils/try';
    import { invalidateAll } from '$app/navigation';
    import LinkSubTaskDialog from './LinkSubTaskDialog.svelte';
    import { toStore } from 'svelte/store';
    import type { LocalSearchIssue } from './types';
    import { ChecklistItemKind } from '~/lib/models/checklist';

    const {
        checklistRef,
        projectId,
        issueId
    }: {
        checklistRef: AsyncRef<PaginatedList<LocalChecklistItem>>;
        projectId: string;
        issueId: string;
    } = $props();
    const { api } = useRuntime();
    const popover = new Popover.Builder({
        forceVisible: true
    });
    const editingSet = new SvelteSet<string>();
    let addTodo = $state.raw(false);
    let openLinkSubTaskDialog = $state.raw(false);

    const onEdit = (item: LocalChecklistItem) => {
        if (!item.id) {
            return;
        }
        editingSet.add(item.id);
    };

    const onEditCancel = (item: LocalChecklistItem) => {
        if (!item.id) {
            return;
        }
        editingSet.delete(item.id);
    };

    const onEditSubmit = (
        item: LocalChecklistItem,
        e: Parameters<SubmitFunction>[0]
    ): ReturnType<SubmitFunction> => {
        if (!item.id) {
            e.cancel();
            return;
        }
        const old = checklistRef.value;
        if (old) {
            checklistRef.value = paginatedList({
                items: old.items.map((a) => {
                    if (a.id === item.id) {
                        return {
                            ...a,
                            content: e.formData.get('content') as string
                        };
                    }
                    return a;
                }),
                totalCount: old.totalCount
            });
        }
        editingSet.delete(item.id);
        return async (e) => {
            if (e.result.type === 'failure') {
                const validation = validateActionFailureData(e.result.data);
                checklistRef.value = old;
                toast({
                    type: 'negative',
                    body: 'Something went wrong while updating the checklist item.',
                    footer: `Error code: ${stringifyActionFailureErrors(
                        validation.ok ? validation.data.errors : validation.errors
                    )}`
                });
            } else if (e.result.type === 'success') {
                toast({
                    type: 'positive',
                    body: 'Checklist item updated successfully.'
                });
            }
            await e.update();
        };
    };

    const onDeleteSubmit = (item: LocalChecklistItem): ReturnType<SubmitFunction> => {
        const old = checklistRef.value;
        if (old) {
            checklistRef.value = paginatedList({
                items: old.items.filter((i) => i.id !== item.id),
                totalCount: old.totalCount - 1
            });
        }
        return async (e) => {
            if (e.result.type === 'failure') {
                const validation = validateActionFailureData(e.result.data);
                checklistRef.value = old;
                toast({
                    type: 'negative',
                    body: 'Something went wrong while deleting the checklist item.',
                    footer: `Error code: ${stringifyActionFailureErrors(
                        validation.ok ? validation.data.errors : validation.errors
                    )}`
                });
            } else if (e.result.type === 'success') {
                toast({
                    type: 'positive',
                    body: 'Checklist item deleted successfully.'
                });
            }
            await e.update();
        };
    };

    const onCompletedChange = (item: LocalChecklistItem, completed: boolean) => {
        patchCompleted(item, completed);
        return completed;
    };

    const patchCompleted = async (item: LocalChecklistItem, completed: boolean) => {
        const old = checklistRef.value;
        if (old) {
            checklistRef.value = paginatedList({
                items: old.items.map((i) => {
                    if (i.id === item.id) {
                        return { ...i, completed };
                    }
                    return i;
                }),
                totalCount: old.totalCount
            });
        }

        const patchAttempt = await attempt.promise(() =>
            api.patch(`checklist-items/${item.id}`, {
                body: { patch: { completed } }
            })
        )(errorCodes.fromFetch);

        if (patchAttempt.failed || !patchAttempt.data.ok) {
            checklistRef.value = old;
            toast({
                type: 'negative',
                body: 'Something went wrong while updating the checklist item.',
                footer: `Error code: ${patchAttempt.failed ? patchAttempt.error : patchAttempt.data.status + ''}`
            });
            return false;
        }

        toast({
            type: 'positive',
            body: 'Checklist item updated successfully.'
        });
        await invalidateAll();
    };

    const onLinkSubmit = (subIssue: LocalSearchIssue): ReturnType<SubmitFunction> => {
        const old = checklistRef.value;
        checklistRef.value = paginatedList({
            items: [
                ...(old?.items ?? []),
                {
                    optimisticId: crypto.randomUUID(),
                    kind: ChecklistItemKind.SubIssue,
                    subIssue: {
                        orderNumber: subIssue.orderNumber,
                        project: {
                            identifier: subIssue.project.identifier
                        },
                        title: subIssue.title
                    }
                }
            ],
            totalCount: (old?.totalCount ?? 0) + 1
        });
        return async (e) => {
            if (e.result.type === 'failure') {
                checklistRef.value = old;
                if (e.result.status === 409) {
                    toast({
                        type: 'negative',
                        body: 'The selected subtask is already linked to this task.'
                    });
                } else {
                    toast({
                        type: 'negative',
                        body: 'Something went wrong while linking the subtask.',
                        footer: `Error code: ${stringifyActionFailureErrors(e.result.data.errors)}`
                    });
                }
            } else {
                toast({
                    type: 'positive',
                    body: 'Subtask linked successfully.'
                });
            }
            await e.update();
        };
    };
</script>

<LinkSubTaskDialog
    open={toStore(
        () => openLinkSubTaskDialog,
        (a) => (openLinkSubTaskDialog = a)
    )}
    {projectId}
    {issueId}
    {onLinkSubmit}
/>

<div class="border-base-border-3 border-b">
    <div class="border-b-base-border-3 flex items-end justify-between gap-4 border-b pb-2">
        <div class="flex items-center gap-2">
            <h2 class="text-h6 font-medium">Checklist</h2>
            {#if checklistRef.value != null && checklistRef.value.items.length > 0}
                <span class="text-base-text-2 c-text-secondary">
                    <strong>{checklistRef.value.items.filter((i) => i.completed).length}</strong> of
                    <strong>{checklistRef.value.items.length}</strong> completed
                </span>
            {/if}
        </div>
        <Button
            {...popover.trigger}
            type="button"
            variant="base"
            class="flex w-fit items-center gap-4 text-sm capitalize"
        >
            <IconPlus />
            Add subtask
        </Button>
        {#if popover.open}
            <Popover {...popover.content}>
                <ul class="space-y-1">
                    <li>
                        <Button
                            type="button"
                            variant="base"
                            class="flex items-center gap-4 px-2 text-sm capitalize"
                            filled={false}
                            onclick={() => {
                                addTodo = true;
                                popover.open = false;
                            }}
                        >
                            <IconPlus />
                            Add simple to-do
                        </Button>
                    </li>
                    <li>
                        <Button
                            type="button"
                            variant="base"
                            filled={false}
                            class="flex items-center gap-4 px-2 text-sm capitalize"
                            onclick={() => {
                                openLinkSubTaskDialog = true;
                            }}
                        >
                            <IconLink />
                            Link existing task
                        </Button>
                    </li>
                </ul>
            </Popover>
        {/if}
    </div>
    {#if checklistRef.isInitialLoading}
        <div class="c-text-secondary px-4 py-2">Loading...</div>
    {:else if checklistRef.value == null || checklistRef.value.items.length == 0}
        {#if !addTodo}
        <div class="c-text-secondary px-4 py-2">
                No checklist items found. Start by adding a new one.
            </div>
        {/if}
    {:else}
        <div>
            <ul class="grid grid-cols-[auto_1fr_auto]">
                {#each checklistRef.value.items as item (item.id ?? item.optimisticId)}
                    <ChecklistItem
                        {item}
                        isEditing={item.id != null && editingSet.has(item.id)}
                        {onEdit}
                        {onEditCancel}
                        {onEditSubmit}
                        {onDeleteSubmit}
                        {onCompletedChange}
                    />
                {/each}
            </ul>
        </div>
    {/if}
    {#if addTodo}
        <div>
            <AddToDo
                {issueId}
                {checklistRef}
                onCancel={() => {
                    addTodo = false;
                }}
                onSubmit={() => {
                    addTodo = false;
                }}
            />
        </div>
    {/if}
</div>
