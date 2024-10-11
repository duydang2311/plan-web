<script lang="ts">
    import { enhance } from '$app/forms';
    import { melt } from '@melt-ui/svelte';
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
    import type { WorkspaceStatus } from '~/lib/models/status';
    import type { PageData } from './$types';

    const {
        queryKey,
        status
    }: { queryKey: unknown[]; status: Pick<WorkspaceStatus, 'id' | 'value'> } = $props();
    const open = writable(false);
    const queryClient = useQueryClient();
</script>

{#snippet errorDescription()}
    <span>
        An error occured when we tried to delete the status <strong>{status.value}</strong>.
    </span>
{/snippet}

{#snippet successDescription()}
    <span>
        The status <strong>{status.value}</strong> has been deleted from your workspace.
    </span>
{/snippet}

<PopoverBuilder
    options={{
        open,
        forceVisible: true,
        positioning: {
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
            <div use:melt={content} class="p-4">
                <Popover class="relative text-pretty">
                    <PopoverArrow melt={arrow}></PopoverArrow>
                    <p class="text-h4 mb-2">Delete the status?</p>
                    <p>
                        The status <strong>{status.value}</strong> will be deleted from your workspace.
                    </p>
                    <form
                        method="post"
                        action="?/delete-status"
                        class="flex justify-end gap-4 mt-4"
                        use:enhance={async () => {
                            await queryClient.cancelQueries({ queryKey });
                            const old =
                                queryClient.getQueryData<Awaited<PageData['statusList']>>(queryKey);
                            if (old) {
                                queryClient.setQueryData(queryKey, {
                                    items: old.items.filter((a) => a.id !== status.id),
                                    totalCount: old.totalCount - 1
                                });
                            }

                            return async ({ result }) => {
                                if (result.type !== 'success') {
                                    queryClient.setQueryData(queryKey, old);
                                    addToast({
                                        data: {
                                            title: 'Could not delete status',
                                            description: errorDescription
                                        }
                                    });
                                } else {
                                    addToast({
                                        data: {
                                            title: 'Status has been deleted',
                                            description: successDescription
                                        }
                                    });
                                }
                                await queryClient.invalidateQueries({ queryKey });
                            };
                        }}
                    >
                        <input type="hidden" name="statusId" value={status.id} />
                        <Button type="button" variant="base" outline class="w-fit" melt={close}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="negative" outline class="w-fit">
                            Delete
                        </Button>
                    </form>
                </Popover>
            </div>
        {/if}
    {/snippet}
</PopoverBuilder>
