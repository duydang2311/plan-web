<script lang="ts">
    import { enhance } from '$app/forms';
    import { useQueryClient } from '@tanstack/svelte-query';
    import { writable } from 'svelte/store';
    import {
        addToast,
        Button,
        Icon,
        IconButton,
        Popover,
        PopoverArrow,
        PopoverBuilder
    } from '~/lib/components';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { type Project } from '~/lib/models/project';

    const { queryKey, project }: { queryKey: unknown[]; project: Pick<Project, 'id' | 'name'> } =
        $props();
    const queryClient = useQueryClient();
    const open = writable(false);
</script>

{#snippet success()}
    Project <strong>{project.name}</strong> has been deleted from your workspace.
{/snippet}

{#snippet failure()}
    An error has occured while deleting the project <strong>{project.name}</strong>.
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
            <Icon name="trash" />
        </IconButton>
        {#if $open}
            <Popover melt={content} class="text-pretty w-96">
                <PopoverArrow melt={arrow} />
                <h2 class="mb-2">Delete project?</h2>
                <p>Would you like to delete the project? The deletion cannot be reverted.</p>
                <form
                    method="post"
                    action="?/delete-project"
                    class="flex gap-2 flex-wrap mt-4 justify-end"
                    use:enhance={async () => {
                        await queryClient.invalidateQueries({ queryKey });
                        const old = queryClient.getQueryData<PaginatedList<Project>>(queryKey);
                        if (old) {
                            queryClient.setQueryData(
                                queryKey,
                                paginatedList({
                                    items: old.items.filter((a) => a.id !== project.id),
                                    totalCount: old.totalCount - 1
                                })
                            );
                        }
                        return async ({ result }) => {
                            if (result.type !== 'success') {
                                queryClient.setQueryData(queryKey, old);
                                addToast({
                                    data: {
                                        title: 'Project deleted',
                                        description: failure
                                    }
                                });
                            } else {
                                addToast({
                                    data: {
                                        title: 'Failed to delete',
                                        description: success
                                    }
                                });
                            }
                            await queryClient.invalidateQueries({ queryKey });
                        };
                    }}
                >
                    <input type="hidden" value={project.id} />
                    <Button type="button" variant="base" outline melt={close} class="w-fit">
                        Cancel
                    </Button>
                    <Button type="submit" variant="negative" outline melt={close} class="w-fit">
                        Delete
                    </Button>
                </form>
            </Popover>
        {/if}
    {/snippet}
</PopoverBuilder>
