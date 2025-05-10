<script lang="ts">
    import { enhance } from '$app/forms';
    import { page } from '$app/state';
    import { isRecord } from '@baetheus/fun/refinement';
    import { melt } from '@melt-ui/svelte';
    import { fade } from 'svelte/transition';
    import invariant from 'tiny-invariant';
    import { Button, DialogBuilder, Errors, Field, Input, Label, toast } from '~/lib/components';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { createForm, formValidator } from '~/lib/utils/form.svelte';
    import {
        stringifyActionFailureErrors,
        validateActionFailureData
    } from '~/lib/utils/kit.client';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import { dialog, tsap } from '~/lib/utils/transition';
    import type { LocalWorkspaceStatus } from './+page.server';
    import { validateAddStatus } from './utils';
    import { IconPlus } from '~/lib/components/icons';
    import type { Writable } from 'svelte/store';
    import Select from '~/lib/components/select';
    import { StatusCategory } from '~/lib/models/status';

    const {
        statusListRef,
        workspaceId,
        open
    }: {
        statusListRef: Ref<PaginatedList<LocalWorkspaceStatus>>;
        workspaceId: string;
        open: Writable<boolean>;
    } = $props();
    const form = createForm({
        validator: formValidator(validateAddStatus)
    });
    const fields = {
        workspaceId: form.createField({ name: 'workspaceId', initialValue: workspaceId }),
        value: form.createField({ name: 'value' }),
        description: form.createField({ name: 'description' })
    };
    let status = $state<'submit' | null>(null);
    let category = $state.raw(StatusCategory.Pending + '');
    const categorySelect = new Select.Builder({
        value: () => category,
        onValueChange: (a) => {
            if (a) {
                category = a;
            }
        },
        forceVisible: true
    });

    $effect(() => {
        const errors = page.form?.['addStatus']?.errors as Record<string, string[]> | undefined;
        if (errors) {
            invariant(isRecord(errors), 'errors must be a record');
            form.setErrors(errors);
        }
    });
</script>

<DialogBuilder
    options={{
        open
    }}
>
    {#snippet children({ overlay, content, title, description, close })}
        <div transition:fade={{ duration: 150 }} use:melt={overlay} class="c-dialog--overlay"></div>
        <div
            class="c-dialog--wrapper"
            in:tsap={dialog.in()}
            out:tsap={dialog.out()}
            use:melt={content}
        >
            <div class="c-dialog space-y-4">
                <div>
                    <div class="flex items-center justify-between gap-4">
                        <h2 use:melt={title} class="capitalize">Create status</h2>
                        <IconPlus class="text-base-fg-1 size-8" />
                    </div>
                    <p use:melt={description} class="c-text-secondary text-pretty">
                        Fill in the form below to create a new status in your workspace.
                    </p>
                </div>
                <form
                    class="space-y-4"
                    method="post"
                    action="?/add_status"
                    use:form
                    use:enhance={async (e) => {
                        form.validate();
                        if (!form.isValid()) {
                            e.cancel();
                            return;
                        }

                        status = 'submit';
                        const old = statusListRef.value;
                        if (old) {
                            statusListRef.value = paginatedList<LocalWorkspaceStatus>({
                                items: [
                                    ...old.items,
                                    {
                                        id: Number.MAX_SAFE_INTEGER,
                                        rank: Number.MAX_SAFE_INTEGER,
                                        value: fields.value.state.value,
                                        description: fields.description.state.value,
                                        color: '',
                                        isDefault: false
                                    }
                                ],
                                totalCount: old.totalCount + 1
                            });
                        }
                        return async ({ result, update }) => {
                            status = null;
                            switch (result.type) {
                                case 'failure':
                                    statusListRef.value = old;
                                    const validation = validateActionFailureData(result.data);
                                    toast({
                                        type: 'negative',
                                        body: 'Something went wrong while creating the status.',
                                        footer: stringifyActionFailureErrors(
                                            validation.ok
                                                ? validation.data.errors
                                                : validation.errors
                                        )
                                    });
                                    break;
                                case 'success':
                                    toast({
                                        type: 'positive',
                                        body: 'Status created successfully.'
                                    });
                            }
                            await update();
                        };
                    }}
                >
                    <input
                        use:fields.workspaceId
                        type="hidden"
                        name={fields.workspaceId.state.name}
                        value={fields.workspaceId.state.value}
                    />
                    <input type="hidden" name="category" value={categorySelect.value} />
                    <div class="flex items-start gap-4 *:flex-1">
                        <Field>
                            <Label for="value">Name</Label>
                            <Input
                                useField={fields.value}
                                id="value"
                                type="text"
                                name={fields.value.state.name}
                                required
                                pattern="[a-zA-Z0-9\s]+"
                                bind:value={fields.value.state.value}
                            />
                            <Errors errors={fields.value.state.errors} />
                        </Field>
                        <Field>
                            <Label for={categorySelect.trigger.id}>Category</Label>
                            <Button
                                {...categorySelect.trigger}
                                type="button"
                                variant="base"
                                outline
                                class="relative w-full pr-10 text-left"
                            >
                                {StatusCategory[Number(categorySelect.value)]}
                                <Select.Icon class="absolute right-2 top-1/2 -translate-y-1/2" />
                            </Button>
                        </Field>
                        {#if categorySelect.open}
                            <Select {...categorySelect.content}>
                                {#each Object.values(StatusCategory).filter((a) => typeof a === 'number') as category (category)}
                                    {@const value = category + ''}
                                    <Select.Option {...categorySelect.getOption(value)}>
                                        {#if categorySelect.isSelected(value)}
                                            <Select.Check />
                                        {/if}
                                        {StatusCategory[Number(category)]}
                                    </Select.Option>
                                {/each}
                            </Select>
                        {/if}
                    </div>
                    <Field>
                        <Label for="desc">Description (optional)</Label>
                        <Input
                            useField={fields.description}
                            id="desc"
                            type="text"
                            name={fields.description.state.name}
                            bind:value={fields.description.state.value}
                        />
                        <Errors errors={fields.description.state.errors} />
                    </Field>
                    <div class="!mt-8 flex justify-end gap-4">
                        <Button variant="base" outline class="w-fit" melt={close}>Cancel</Button>
                        <Button outline class="w-fit" disabled={status === 'submit'}>Create</Button>
                    </div>
                </form>
            </div>
        </div>
    {/snippet}
</DialogBuilder>
