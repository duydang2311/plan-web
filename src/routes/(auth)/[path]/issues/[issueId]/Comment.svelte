<script lang="ts" module>
    import gsap from 'gsap';

    function popoverIn(node: HTMLElement) {
        gsap.from(node, {
            scale: 0.98,
            opacity: 0,
            y: '-0.2rem',
            duration: 0.15,
            ease: 'power1.out'
        });
        return {
            duration: 150
        };
    }

    function popoverOut(node: HTMLElement) {
        gsap.to(node, { scale: 0.98, opacity: 0, y: '-0.2rem', duration: 0.15, ease: 'power1.in' });
        return {
            duration: 150
        };
    }
</script>

<script lang="ts">
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import { melt } from '@melt-ui/svelte';
    import { type InfiniteData, useQueryClient } from '@tanstack/svelte-query';
    import { Editor } from '@tiptap/core';
    import DOMPurify from 'isomorphic-dompurify';
    import { DateTime } from 'luxon';
    import Button from '~/lib/components/Button.svelte';
    import PopoverArrow from '~/lib/components/PopoverArrow.svelte';
    import PopoverBuilder from '~/lib/components/PopoverBuilder.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { addToast } from '~/lib/components/Toaster.svelte';
    import type { IssueComment } from '~/lib/models/issue_comment';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { slideIn, slideOut } from './transitions';

    const { comment, isAuthor, size }: { comment: IssueComment; isAuthor: boolean; size: number } =
        $props();
    const queryKey = ['comments', { issueId: $page.params['issueId'], size }];
    const queryClient = useQueryClient();
    let editing = $state(false);
    let editor = $state<Editor>();
    let open = $state(false);
</script>

<div class="max-w-full rounded-md">
    <div class="flex items-start gap-2">
        <div class="size-12 bg-primary-1 rounded-full"></div>
        <div>
            <p class="font-display font-bold">User</p>
            <p class="text-base-fg-3">
                <small>
                    {DateTime.fromISO(comment.createdTime).toLocaleString(DateTime.DATETIME_SHORT)}
                </small>
            </p>
        </div>
    </div>
    <div class="mt-4">
        {#if editing}
            <div in:slideIn out:slideOut>
                <form
                    method="post"
                    action="?/edit-comment"
                    class="relative"
                    use:enhance={async (e) => {
                        if (!editor) {
                            e.cancel();
                            return;
                        }
                        const oldData =
                            queryClient.getQueryData<
                                InfiniteData<PaginatedList<IssueComment>, number>
                            >(queryKey);
                        if (oldData) {
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
                        editing = false;
                        return async ({ result, update }) => {
                            if (result.type !== 'success') {
                                queryClient.setQueryData(queryKey, oldData);
                            }
                            await update({ invalidateAll: false, reset: false });
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
                            variant="base"
                            size="sm"
                            filled={false}
                            onclick={() => (editing = false)}
                        >
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" filled={false}>Save</Button>
                    </div>
                </form>
            </div>
        {:else}
            <div in:slideIn out:slideOut class="prose">
                <!-- eslint-disable-next-line svelte/no-at-html-tags -->
                {@html DOMPurify.sanitize(comment.content, { USE_PROFILES: { html: true } })}
            </div>
        {/if}
    </div>
    {#if isAuthor}
        <div class="mt-4 flex flex-wrap gap-2">
            <Button
                filled={false}
                variant="base"
                size="sm"
                class="w-fit"
                onclick={() => (editing = true)}
            >
                Edit
            </Button>
            <PopoverBuilder bind:open>
                {#snippet children({ trigger, content, arrow, close })}
                    <Button
                        filled={false}
                        variant="negative"
                        size="sm"
                        class="w-fit"
                        melt={trigger}
                    >
                        Delete
                    </Button>
                    {#if open}
                        <div in:popoverIn out:popoverOut class="c-popover" use:melt={content}>
                            <PopoverArrow melt={arrow} />
                            <div>
                                <p class="font-medium text-h5 text-base-fg-1">
                                    Confirm comment deletion
                                </p>
                                <p class="mt-2">Proceed to delete this comment?</p>
                                <div class="flex w-fit ml-auto gap-2 mt-4">
                                    <Button variant="base" melt={close}>Cancel</Button>
                                    <form
                                        method="post"
                                        action="?/delete-comment"
                                        use:enhance={() => {
                                            return async ({ result, update }) => {
                                                open = false;
                                                if (result.type === 'success') {
                                                    addToast({
                                                        data: {
                                                            title: 'Comment deleted',
                                                            description:
                                                                'The selected comment has been deleted.'
                                                        }
                                                    });
                                                }
                                                await update({
                                                    reset: false
                                                });
                                            };
                                        }}
                                    >
                                        <input
                                            type="hidden"
                                            name="issueCommentId"
                                            value={comment.id}
                                        />
                                        <Button variant="negative">Delete</Button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/snippet}
            </PopoverBuilder>
        </div>
    {/if}
</div>
