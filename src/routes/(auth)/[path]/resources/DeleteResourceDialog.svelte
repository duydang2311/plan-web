<script lang="ts">
    import { enhance } from '$app/forms';
    import type { Writable } from 'svelte/store';
    import { Button, DialogBuilder, toast } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import {
        stringifyActionFailureErrors,
        validateActionFailureData
    } from '~/lib/utils/kit.client';
    import { watch, type Ref } from '~/lib/utils/runes.svelte';
    import { dialog, dialogOverlay, tsap } from '~/lib/utils/transition';
    import type { LocalWorkspaceResource } from './+page.server';

    const {
        open,
        workspaceResource,
        resourceListRef,
        onSubmit
    }: {
        open: Writable<boolean>;
        workspaceResource: LocalWorkspaceResource | null;
        resourceListRef: Ref<PaginatedList<LocalWorkspaceResource>>;
        onSubmit: () => void;
    } = $props();

    let uiWorkspaceResource = $state.raw(workspaceResource);
    watch(() => workspaceResource)(() => {
        if (workspaceResource) {
            uiWorkspaceResource = workspaceResource;
        }
    });
</script>

<DialogBuilder options={{ open, forceVisible: true }}>
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
            {#if uiWorkspaceResource == null}
                Invalid state. Workspace resource cannot be null.
            {:else}
                <div class="c-dialog">
                    <form
                        method="post"
                        action="?/delete_resource"
                        use:enhance={(e) => {
                            const wr = workspaceResource;
                            if (wr == null) {
                                e.cancel();
                                return;
                            }
                            const old = resourceListRef.value;
                            if (old) {
                                resourceListRef.value = paginatedList({
                                    items: old.items.filter(
                                        (a) => a.resource.id !== wr.resource.id
                                    ),
                                    totalCount: old.totalCount - 1
                                });
                            }
                            onSubmit();
                            return ({ result }) => {
                                if (result.type === 'success') {
                                    toast({
                                        type: 'positive',
                                        body: `Workspace resource '${wr.resource.name}' deleted successfully.`
                                    });
                                } else if (result.type === 'failure') {
                                    const data = validateActionFailureData(result.data);
                                    toast({
                                        type: 'negative',
                                        body: `An error occurred while deleting the workspace resource (code: ${stringifyActionFailureErrors(data.ok ? data.data.errors : data.errors)}).`
                                    });
                                    resourceListRef.value = old;
                                }
                            };
                        }}
                    >
                        <input type="hidden" name="id" value={uiWorkspaceResource.resource.id} />
                        <div class="mb-2 flex items-center justify-between gap-4">
                            <h2 class="capitalize">Delete resource</h2>
                            <IconTrash class="text-negative-1 size-10" />
                        </div>
                        <p class="text-pretty">
                            Are you sure you want to delete the workspace resource
                            <strong>'{uiWorkspaceResource.resource.name}'</strong>?<br />
                            <span class="c-label"> This action cannot be undone. </span>
                        </p>
                        <div class="mt-4 flex items-center justify-end gap-2 *:w-fit">
                            <Button
                                variant="base"
                                outline
                                {...builder.close}
                                action={builder.close.action}>Cancel</Button
                            >
                            <Button variant="negative" outline>Delete</Button>
                        </div>
                    </form>
                </div>
            {/if}
        </div>
    {/snippet}
</DialogBuilder>
