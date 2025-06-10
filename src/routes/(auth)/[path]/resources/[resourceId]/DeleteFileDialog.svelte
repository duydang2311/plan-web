<script lang="ts">
    import { enhance } from '$app/forms';
    import type { Writable } from 'svelte/store';
    import { Button, DialogBuilder, toast } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { ResourceFile } from '~/lib/models/resource';
    import {
        stringifyActionFailureErrors,
        validateActionFailureData
    } from '~/lib/utils/kit.client';
    import { watch, type Ref } from '~/lib/utils/runes.svelte';
    import { dialog, dialogOverlay, tsap } from '~/lib/utils/transition';
    import type { LocalResourceFile } from './+page.server';

    const {
        open,
        resourceFile,
        fileListRef,
        onSubmit
    }: {
        open: Writable<boolean>;
        resourceFile: ResourceFile | null;
        fileListRef: Ref<PaginatedList<LocalResourceFile> | undefined>;
        onSubmit: () => void;
    } = $props();

    let uiResourceFile = $state.raw(resourceFile);
    watch(() => resourceFile)(() => {
        if (resourceFile) {
            uiResourceFile = resourceFile;
        }
    });
</script>

{#snippet successToast(name: string)}
    File <strong>'{name}'</strong> deleted successfully.
{/snippet}

{#snippet errorToast(name: string)}
    Something went wrong while trying to delete the file <strong>'{name}'</strong>.
{/snippet}

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
            {#if uiResourceFile == null}
                Invalid state. File cannot be null.
            {:else}
                <div class="c-dialog">
                    <form
                        method="post"
                        action="?/delete_resource_file"
                        use:enhance={(e) => {
                            const currentResFile = resourceFile;
                            if (currentResFile == null) {
                                e.cancel();
                                return;
                            }
                            const old = fileListRef.value;
                            if (old) {
                                fileListRef.value = paginatedList({
                                    items: old.items.filter((a) => a.id !== currentResFile.id),
                                    totalCount: old.totalCount - 1
                                });
                            }
                            onSubmit();
                            return async ({ result, update }) => {
                                if (result.type === 'success') {
                                    toast({
                                        type: 'positive',
                                        // @ts-ignore
                                        body: successToast,
                                        bodyProps: currentResFile.originalName
                                    });
                                } else if (result.type === 'failure') {
                                    const data = validateActionFailureData(result.data);
                                    toast({
                                        type: 'negative',
                                        // @ts-ignore
                                        body: errorToast,
                                        bodyProps: currentResFile.originalName,
                                        footer: stringifyActionFailureErrors(
                                            data.ok ? data.data.errors : data.errors
                                        )
                                    });
                                    fileListRef.value = old;
                                } else {
                                    await update();
                                }
                            };
                        }}
                    >
                        <input type="hidden" name="id" value={uiResourceFile.id} />
                        <div class="mb-2 flex items-center justify-between gap-4">
                            <h2 class="capitalize">Delete resource</h2>
                            <IconTrash class="text-negative-1 size-10" />
                        </div>
                        <p class="text-pretty">
                            Are you sure you want to delete the workspace resource
                            <strong>'{uiResourceFile.originalName}'</strong>?<br />
                            <span class="c-label">This action cannot be undone.</span>
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
