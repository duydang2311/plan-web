<script lang="ts" context="module">
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
    import type { IssueComment } from '~/lib/models/issue_comment';
    import DOMPurify from 'isomorphic-dompurify';
    import { DateTime } from 'luxon';
    import Button from '~/lib/components/Button.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { slideIn, slideOut } from './transitions';
    import { Editor } from '@tiptap/core';
    import { page } from '$app/stores';
    import { enhance } from '$app/forms';
    import { fluentSearchParams } from '~/lib/utils/url';
    import PopoverBuilder from '~/lib/components/PopoverBuilder.svelte';
    import { melt } from '@melt-ui/svelte';
    import PopoverArrow from '~/lib/components/PopoverArrow.svelte';
    import { addToast } from '~/lib/components/Toaster.svelte';

    const {
        comment,
        isAuthor,
        isEditing
    }: { comment: IssueComment; isAuthor: boolean; isEditing: boolean } = $props();
    const editHref = $derived(
        fluentSearchParams($page.url).set('edit-comment', comment.id).toString()
    );
    const cancelHref = $derived(fluentSearchParams($page.url).delete('edit-comment').toString());
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
        {#if isEditing}
            <div in:slideIn out:slideOut>
                <form
                    method="post"
                    action="?/edit-comment"
                    class="relative"
                    use:enhance={(e) => {
                        if (!editor) {
                            e.cancel();
                            return;
                        }
                        e.formData.set('content', editor.getHTML());
                    }}
                >
                    <input type="hidden" name="issueCommentId" value={comment.id} />
                    <Tiptap
                        bind:editor
                        name="content"
                        content={comment.content}
                        containerProps={{ class: 'pb-8' }}
                    />
                    <div class="flex gap-2 absolute right-2 bottom-2">
                        <Button as="link" href={cancelHref} variant="base" size="sm" filled={false}>
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
            <Button as="link" href={editHref} filled={false} variant="base" size="sm" class="w-fit"
                >Edit</Button
            >
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
                                                if (result.type === 'success') {
                                                    addToast({
                                                        data: {
                                                            title: 'Comment deleted',
                                                            description:
                                                                'The selected comment has been deleted.'
                                                        }
                                                    });
                                                }
                                                await update();
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
