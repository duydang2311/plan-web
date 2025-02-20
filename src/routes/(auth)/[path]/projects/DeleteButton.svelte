<script lang="ts">
    import { enhance } from '$app/forms';
    import { invalidate } from '$app/navigation';
    import { writable } from 'svelte/store';
    import {
        Button,
        IconButton,
        Popover,
        PopoverArrow,
        PopoverBuilder,
        toast
    } from '~/lib/components';
    import { IconTrash } from '~/lib/components/icons';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { type Project } from '~/lib/models/project';
    import { validateActionFailureData } from '~/lib/utils/kit.client';
    import type { Ref } from '~/lib/utils/runes.svelte';
    import type { LocalProject } from './+page.server';

    const {
        ref,
        project
    }: {
        ref: Ref<PaginatedList<LocalProject> | undefined>;
        project: Pick<Project, 'id' | 'name'>;
    } = $props();
    const open = writable(false);
</script>

{#snippet success()}
    Project <strong>{project.name}</strong> has been deleted from your workspace.
{/snippet}

{#snippet genericFailure(code: string)}
    <p>
        An error has occured while deleting the project <strong>{project.name}</strong>.
    </p>
    <p class="text-base-fg-ghost text-sm">
        Reason: {code}.
    </p>
{/snippet}

{#snippet forbiddenFailure()}
    You need sufficient privileges to perform this action.
{/snippet}

<PopoverBuilder
    options={{
        open,
        forceVisible: true,
        positioning: {
            placement: 'bottom',
            fitViewport: true
        }
    }}
>
    {#snippet children({ trigger, content, arrow, close })}
        <IconButton
            type="button"
            variant="negative"
            title="Remove member"
            class="w-fit"
            melt={trigger}
        >
            <IconTrash />
        </IconButton>
        {#if $open}
            <Popover melt={content} class="w-96 text-pretty">
                <PopoverArrow melt={arrow} />
                <h2 class="mb-2">Delete project?</h2>
                <p>Would you like to delete the project? This action cannot be undone.</p>
                <form
                    method="post"
                    action="?/delete_project"
                    class="mt-4 flex flex-wrap justify-end gap-2"
                    use:enhance={async () => {
                        const old = ref.value;
                        if (old) {
                            ref.value = paginatedList({
                                items: old.items.filter((a) => a.id !== project.id),
                                totalCount: old.totalCount - 1
                            });
                        }
                        return async ({ result }) => {
                            if (result.type === 'success') {
                                toast({
                                    type: 'positive',
                                    body: success
                                });
                            } else if (result.type === 'failure') {
                                const validation = validateActionFailureData(
                                    result.data?.deleteProject
                                );
                                if (!validation.ok) {
                                    toast({
                                        type: 'negative',
                                        body: genericFailure,
                                        bodyProps: 'unknown'
                                    });
                                    return;
                                }

                                if (validation.data.errors.root.includes('403')) {
                                    toast({
                                        type: 'negative',
                                        body: forbiddenFailure
                                    });
                                } else {
                                    toast({
                                        type: 'negative',
                                        body: genericFailure,
                                        bodyProps: validation.data.errors.root[0] ?? 'unknown'
                                    });
                                }
                                ref.value = old;
                            }
                            await invalidate('fetch:projects');
                        };
                    }}
                >
                    <input type="hidden" name="projectId" value={project.id} />
                    <Button type="button" variant="base" outline melt={close} class="w-fit">
                        Cancel
                    </Button>
                    <Button type="submit" variant="negative" outline class="w-fit">Delete</Button>
                </form>
            </Popover>
        {/if}
    {/snippet}
</PopoverBuilder>
