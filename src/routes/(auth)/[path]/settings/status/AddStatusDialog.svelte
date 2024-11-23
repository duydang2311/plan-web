<script lang="ts">
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import { isRecord } from '@baetheus/fun/refinement';
    import { melt } from '@melt-ui/svelte';
    import { useQueryClient } from '@tanstack/svelte-query';
    import { fade } from 'svelte/transition';
    import invariant from 'tiny-invariant';
    import { Button, Dialog, Errors, Field, Input, Label } from '~/lib/components';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { createForm, formValidator } from '~/lib/utils/form.svelte';
    import { dialog, tsap } from '~/lib/utils/transition';
    import type { LocalWorkspaceStatus } from './+page.server';
    import { validateAddStatus } from './utils';

    const { workspaceId, onClose }: { workspaceId: string; onClose: () => void } = $props();
    const queryKey = ['workspace-statuses', { workspaceId: workspaceId }];
    const queryClient = useQueryClient();
    const form = createForm({
        validator: formValidator(validateAddStatus)
    });
    const fields = {
        workspaceId: form.createField({ name: 'workspaceId', initialValue: workspaceId }),
        value: form.createField({ name: 'value' }),
        description: form.createField({ name: 'description' })
    };
    let status = $state<'submit' | null>(null);

    $effect(() => {
        const errors = $page.form?.['addStatus']?.errors as Record<string, string[]> | undefined;
        if (errors) {
            invariant(isRecord(errors), 'errors must be a record');
            form.setErrors(errors);
        }
    });
</script>

<Dialog
    options={{
        defaultOpen: true,
        onOpenChange: ({ next }) => {
            if (next === false) {
                onClose();
            }
            return next;
        }
    }}
>
    {#snippet children({ overlay, content, title, description, close })}
        <div
            transition:fade|global={{ duration: 150 }}
            use:melt={overlay}
            class="fixed inset-0 bg-black/20"
        ></div>
        <div class="fixed inset-8 z-50">
            <div
                in:tsap|global={dialog.in()}
                out:tsap|global={dialog.out()}
                use:melt={content}
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-base-1 p-8 rounded-md w-full max-w-paragraph-lg space-y-4 border border-base-border-2 outline-none"
            >
                <div>
                    <h2 use:melt={title} class="font-medium">Add a new status</h2>
                    <p use:melt={description} class="text-pretty">
                        Fill in the form below to create a new status for your entire workspace.
                    </p>
                </div>
                <form
                    class="space-y-4"
                    method="post"
                    action="?/add-status"
                    use:form
                    use:enhance={async (e) => {
                        form.validate();
                        if (!form.isValid()) {
                            e.cancel();
                            return;
                        }

                        status = 'submit';
                        await queryClient.cancelQueries({ queryKey });
                        const old =
                            queryClient.getQueryData<PaginatedList<LocalWorkspaceStatus>>(queryKey);
                        if (old) {
                            queryClient.setQueryData(
                                queryKey,
                                paginatedList<LocalWorkspaceStatus>({
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
                                })
                            );
                        }
                        return async ({ result, formElement }) => {
                            status = null;
                            if (result.type !== 'success') {
                                queryClient.setQueryData(queryKey, old);
                            }

                            formElement.reset();
                            await queryClient.invalidateQueries({ queryKey });
                        };
                    }}
                >
                    <input
                        use:fields.workspaceId
                        type="hidden"
                        name={fields.workspaceId.state.name}
                        value={fields.workspaceId.state.value}
                    />
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
                    <div class="flex justify-end gap-4 !mt-8">
                        <Button variant="base" outline class="w-fit" melt={close}>Cancel</Button>
                        <Button outline class="w-fit" disabled={status === 'submit'}>Create</Button>
                    </div>
                </form>
            </div>
        </div>
    {/snippet}
</Dialog>
