<script lang="ts">
    import { enhance } from '$app/forms';
    import { Button, Errors, Field, Input, toast } from '~/lib/components';
    import { IconCheck, IconXMark } from '~/lib/components/icons';
    import { ChecklistItemKind } from '~/lib/models/checklist';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { focus, mergeActions } from '~/lib/utils/actions.client';
    import { createForm } from '~/lib/utils/form.svelte';
    import {
        stringifyActionFailureErrors,
        validateActionFailureData
    } from '~/lib/utils/kit.client';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { LocalChecklistItem } from './+page.server';

    const {
        issueId,
        checklistRef,
        onSubmit,
        onCancel
    }: {
        issueId: string;
        checklistRef: Ref<PaginatedList<LocalChecklistItem>>;
        onSubmit: VoidFunction;
        onCancel: VoidFunction;
    } = $props();
    const form = createForm();
    const fields = {
        content: form.createField({
            name: 'content',
            initialValue: '',
            validator: (state, props) => {
                if (state.value.length <= 0) {
                    return props.error('required');
                }
            }
        })
    };
</script>

<Field>
    <form
        method="post"
        action="?/add_checklist_item"
        class="flex justify-between gap-4"
        use:form
        use:enhance={(e) => {
            form.validate();
            if (!form.isValid()) {
                e.cancel();
                return;
            }
            onSubmit();
            const old = checklistRef.value;
            const optimisticId = crypto.randomUUID();
            const current = paginatedList({
                items: [
                    ...(old?.items ?? []),
                    {
                        optimisticId,
                        kind: ChecklistItemKind.Todo,
                        content: fields.content.state.value
                    }
                ],
                totalCount: (old?.totalCount ?? 0) + 1
            });
            checklistRef.value = current;
            return async (e) => {
                if (e.result.type === 'failure') {
                    const validation = validateActionFailureData(e.result.data);
                    toast({
                        type: 'negative',
                        body: 'Something went wrong while adding the checklist item',
                        footer: stringifyActionFailureErrors(
                            validation.ok ? validation.data.errors : validation.errors
                        )
                    });
                    checklistRef.value = old;
                } else if (e.result.type === 'success') {
                    const id = e.result.data?.id as string;
                    checklistRef.value = paginatedList({
                        items:
                            current.items.map((a) =>
                                a.optimisticId === optimisticId
                                    ? {
                                          ...a,
                                          id,
                                          optimisticId: undefined
                                      }
                                    : a
                            ) ?? [],
                        totalCount: current.totalCount ?? 0
                    });
                    toast({
                        type: 'positive',
                        body: 'Checklist item added successfully.'
                    });
                }
                await e.update();
            };
        }}
    >
        <input type="hidden" name="parentIssueId" value={issueId} />
        <input type="hidden" name="kind" value={ChecklistItemKind.Todo} />
        <Input
            type="text"
            action={mergeActions(focus, fields.content)}
            name={fields.content.state.name}
            bind:value={fields.content.state.value}
            placeholder="Title"
            class="grow"
        />
        <div class="flex gap-2">
            <Button type="submit" variant="primary" class="flex items-center gap-2 text-sm">
                <IconCheck />
                <span>Add</span>
            </Button>
            <Button type="button" variant="base" class="flex items-center gap-2 text-sm" onclick={onCancel}>
                <IconXMark />
                <span>Cancel</span>
            </Button>
        </div>
    </form>
    <Errors errors={fields.content.state.errors} />
</Field>
