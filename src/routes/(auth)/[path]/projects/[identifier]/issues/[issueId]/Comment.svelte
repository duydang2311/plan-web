<script lang="ts">
    import { enhance } from '$app/forms';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { type InfiniteData, useQueryClient } from '@tanstack/svelte-query';
    import { Editor } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { DateTime } from 'luxon';
    import { Avatar, Icon, OptionalLink } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import type { LocalComment } from './+page.server';
    import CommentActions from './CommentActions.svelte';

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
</script>

<div class="rounded-lg border border-base-border-3 p-4 shadow-sm dark:bg-base-3">
    <div class="flex items-center gap-2">
        <OptionalLink
            href={comment.author.profile ? `/profiles/${comment.author.profile.name}` : undefined}
        >
            <Avatar
                seed={comment.author.email}
                src={imageFromAsset(cloudinary)(comment.author.profile?.image)
                    ?.resize(Resize.fill(32))
                    .toURL()}
                class="size-8"
            />
        </OptionalLink>
        <div class="text-sm">
            <OptionalLink
                href={comment.author.profile
                    ? `/profiles/${comment.author.profile.name}`
                    : undefined}
            >
                <span class="font-bold">
                    {comment.author.profile?.displayName ?? comment.author.email}
                </span>
            </OptionalLink>
            added a comment
            <span class="text-base-fg-4">
                · {DateTime.fromISO(comment.createdTime).toRelative()}</span
            >
        </div>
        {#if isAuthor}
            <div class="ml-auto">
                <CommentActions commentId={comment.id} bind:editing {queryKey} />
            </div>
        {/if}
    </div>
    <div class="mt-2">
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
</div>
