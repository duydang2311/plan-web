<script lang="ts">
    import { enhance } from '$app/forms';
    import type { InfiniteData } from '@tanstack/svelte-query';
    import { writable } from 'svelte/store';
    import {
        addToast,
        Button,
        Icon,
        Popover,
        PopoverArrow,
        PopoverBuilder
    } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { LocalComment } from './+page.server';

    let {
        commentId,
        editing = $bindable(),
        queryKey
    }: { commentId: string; editing: boolean; queryKey: unknown[] } = $props();

    const { queryClient } = useRuntime();
    const open = writable(false);
</script>

<div class="flex flex-wrap gap-1 justify-end text-sm">
    <Button
        type="button"
        filled={false}
        variant="base"
        size="sm"
        class="flex gap-2 items-center w-fit"
        onclick={() => {
            editing = true;
        }}
        disabled={editing === true}
    >
        <Icon name="edit" />
        Edit
    </Button>
    <PopoverBuilder options={{ open, forceVisible: true }}>
        {#snippet children({ trigger, content, arrow, close })}
            <Button
                type="button"
                filled={false}
                variant="negative"
                size="sm"
                class="flex gap-2 items-center w-fit"
                melt={trigger}
            >
                <Icon name="trash" />
                Delete
            </Button>
            {#if $open}
                <Popover melt={content} class="text-pretty w-96">
                    <PopoverArrow melt={arrow} />
                    <div>
                        <h2 class="mb-2">Delete comment?</h2>
                        <p>The comment will be permanently deleted and cannot be undone.</p>
                        <div class="flex w-fit ml-auto gap-2 mt-4">
                            <Button type="button" variant="base" outline melt={close}>
                                Cancel
                            </Button>
                            <form
                                method="post"
                                action="?/delete-comment"
                                use:enhance={async () => {
                                    $open = false;
                                    const oldData =
                                        queryClient.getQueryData<
                                            InfiniteData<PaginatedList<LocalComment>, number>
                                        >(queryKey);
                                    if (oldData) {
                                        await queryClient.cancelQueries({ queryKey });
                                        queryClient.setQueryData(queryKey, {
                                            ...oldData,
                                            pages: oldData.pages.map((a) =>
                                                a
                                                    ? {
                                                          ...a,
                                                          items: a.items.filter(
                                                              (b) => b.id !== commentId
                                                          )
                                                      }
                                                    : a
                                            )
                                        });
                                    }
                                    return async ({ result }) => {
                                        if (result.type !== 'success') {
                                            queryClient.setQueryData(queryKey, oldData);
                                        } else {
                                            addToast({
                                                data: {
                                                    title: 'Comment deleted',
                                                    description:
                                                        'The selected comment has been deleted.'
                                                }
                                            });
                                        }
                                        await queryClient.invalidateQueries({
                                            queryKey
                                        });
                                    };
                                }}
                            >
                                <input type="hidden" name="issueCommentId" value={commentId} />
                                <Button type="submit" outline variant="negative">Delete</Button>
                            </form>
                        </div>
                    </div>
                </Popover>
            {/if}
        {/snippet}
    </PopoverBuilder>
</div>
