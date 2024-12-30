<script lang="ts">
    import { enhance } from '$app/forms';
    import { type InfiniteData, useQueryClient } from '@tanstack/svelte-query';
    import { Editor } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { DateTime } from 'luxon';
    import { writable } from 'svelte/store';
    import { Avatar, Icon, Popover } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';
    import PopoverArrow from '~/lib/components/PopoverArrow.svelte';
    import PopoverBuilder from '~/lib/components/PopoverBuilder.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { addToast } from '~/lib/components/Toaster.svelte';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { LocalComment } from './+page.server';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { Resize } from '@cloudinary/url-gen/actions';

    let {
        comment,
        issueId,
        isAuthor,
        size
    }: { comment: LocalComment; issueId: string; isAuthor: boolean; size: number } = $props();
    const queryKey = ['comments', { issueId, size }];
    const queryClient = useQueryClient();
    const { cloudinary } = useRuntime();
    let editing = $state(false);
    let editor = $state.raw<Editor>();
    const open = writable(false);
</script>

<div class="rounded-lg border border-base-border-3 p-4 pb-2 shadow-sm dark:bg-base-3">
    <div class="flex items-center gap-2">
        <Avatar
            seed={comment.author.email}
            src={imageFromAsset(cloudinary)(comment.author.profile?.image)
                ?.resize(Resize.fill(32))
                .toURL()}
            class="size-8"
        />
        <div class="text-sm text-base-fg-4">
            <span class="font-bold font-display text-base-fg-2">
                {comment.author.profile?.displayName ?? 'N/A'}
            </span>
            added a comment · {DateTime.fromISO(comment.createdTime).toRelative()}
        </div>
    </div>
    <div class="mt-4">
        {#if editing}
            <form
                method="post"
                action="?/edit-comment"
                class="relative"
                use:enhance={async (e) => {
                    if (!editor) {
                        e.cancel();
                        return;
                    }
                    editing = false;
                    const oldData =
                        queryClient.getQueryData<InfiniteData<PaginatedList<LocalComment>, number>>(
                            queryKey
                        );
                    if (oldData) {
                        await queryClient.cancelQueries({ queryKey });
                        queryClient.setQueryData(queryKey, {
                            ...oldData,
                            pages: oldData.pages.map((a) =>
                                a
                                    ? {
                                          ...a,
                                          items: a.items.map((b) =>
                                              b.id === comment.id
                                                  ? { ...b, content: editor!.getHTML() }
                                                  : b
                                          )
                                      }
                                    : a
                            )
                        });
                    }
                    e.formData.set('content', editor.getHTML());
                    return async ({ result }) => {
                        if (result.type !== 'success') {
                            queryClient.setQueryData(queryKey, oldData);
                        }
                        await queryClient.invalidateQueries({ queryKey });
                    };
                }}
            >
                <input type="hidden" name="issueCommentId" value={comment.id} />
                <Tiptap
                    bind:editor
                    name="content"
                    content={comment.content}
                    editorProps={{ class: 'pb-8' }}
                />
                <div class="flex gap-2 absolute right-2 bottom-2">
                    <Button
                        type="button"
                        variant="base"
                        size="sm"
                        onclick={() => {
                            editing = false;
                        }}
                        class="flex gap-2 items-center w-fit"
                    >
                        <Icon name="x-mark" />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        class="flex gap-2 items-center w-fit"
                    >
                        <Icon name="check" />
                        Save
                    </Button>
                </div>
            </form>
        {:else}
            <div class="prose max-w-full">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html DOMPurify.sanitize(comment.content, { USE_PROFILES: { html: true } })}
            </div>
        {/if}
    </div>
    {#if isAuthor}
        <div class="mt-4 flex flex-wrap gap-2">
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
                                                    InfiniteData<
                                                        PaginatedList<LocalComment>,
                                                        number
                                                    >
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
                                                                      (b) => b.id !== comment.id
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
                                                await queryClient.invalidateQueries({ queryKey });
                                            };
                                        }}
                                    >
                                        <input
                                            type="hidden"
                                            name="issueCommentId"
                                            value={comment.id}
                                        />
                                        <Button type="submit" outline variant="negative">
                                            Delete
                                        </Button>
                                    </form>
                                </div>
                            </div>
                        </Popover>
                    {/if}
                {/snippet}
            </PopoverBuilder>
        </div>
    {/if}
</div>
