<script lang="ts">
    import { enhance } from '$app/forms';
    import { melt } from '@melt-ui/svelte';
    import { useQueryClient } from '@tanstack/svelte-query';
    import { fade } from 'svelte/transition';
    import { Button, Dialog, Errors, Field, Input, Label } from '~/lib/components';
    import { dialog, tsap } from '~/lib/utils/transition';
    import { type ValidationResult } from '~/lib/utils/validation';
    import { decodeAddStatus, validateAddStatus } from './utils';
    import { page } from '$app/stores';

    const { workspaceId, onClose }: { workspaceId: string; onClose: () => void } = $props();
    const queryKey = ['workspace-statuses', { workspaceId: workspaceId }];
    const queryClient = useQueryClient();
    let validation = $state<ValidationResult>();
    const errors = $derived(
        ($page.form?.['addStatus']?.errors as Record<string, string[]> | undefined) ??
            (validation != null && !validation.ok ? validation.errors : null)
    );
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
                class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-base-1 p-8 rounded-md w-full max-w-paragraph-lg space-y-4 border border-base-border"
            >
                <div>
                    <p use:melt={title} class="text-h4 font-medium">Add a new status</p>
                    <p use:melt={description} class="text-base-fg-3 text-pretty">
                        Fill in the form below to create a new status for your entire workspace.
                    </p>
                </div>
                <form
                    class="space-y-4"
                    method="post"
                    action="?/add-status"
                    oninput={(e) => {
                        validation = validateAddStatus(
                            decodeAddStatus(new FormData(e.currentTarget))
                        );
                    }}
                    use:enhance={(e) => {
                        if (validation == null || !validation.ok) {
                            e.cancel();
                            return;
                        }
                        return async ({ result, update }) => {
                            if (result.type === 'success') {
                                await queryClient.invalidateQueries({ queryKey });
                            }
                            await update({ invalidateAll: false, reset: true });
                        };
                    }}
                >
                    <input type="hidden" name="workspaceId" value={workspaceId} />
                    <Field>
                        <Label for="value">Name</Label>
                        <Input
                            id="value"
                            name="value"
                            type="text"
                            aria-invalid={errors?.['value'] != null}
                        />
                        <Errors errors={errors?.['value']} />
                    </Field>
                    <Field>
                        <Label for="desc">Description (optional)</Label>
                        <Input id="desc" name="description" type="text" />
                        <Errors errors={errors?.['description']} />
                    </Field>
                    <div class="flex justify-end gap-4 !mt-8">
                        <Button variant="base" outline class="w-fit" melt={close}>Cancel</Button>
                        <Button outline disabled={errors != null} class="w-fit">Create</Button>
                    </div>
                </form>
            </div>
        </div>
    {/snippet}
</Dialog>
