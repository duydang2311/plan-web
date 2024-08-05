<script lang="ts">
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import { Editor } from '@tiptap/core';
    import type { Subscription } from 'nats.ws';
    import { onMount } from 'svelte';
    import Button from '~/lib/components/Button.svelte';
    import Icon from '~/lib/components/Icon.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { addToast } from '~/lib/components/Toaster.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { IssueComment } from '~/lib/models/issue_comment';
    import { type PaginatedList, paginatedList } from '~/lib/models/paginatedList';
    import type { ValidationResult } from '~/lib/utils/validation';
    import type { ActionData, PageData } from './$types';
    import Comment from './Comment.svelte';
    import Issue from './Issue.svelte';
    import { clientValidate } from './utils.client';
    import { tryPromise } from '~/lib/utils/neverthrow';

    let { data, form }: { data: PageData; form: ActionData } = $props();
    let editor = $state<Editor>();
    let validation = $state<ValidationResult>();
    let commentList = $state.frozen<PaginatedList<IssueComment>>(
        data.comment.list instanceof Promise ? paginatedList() : data.comment.list
    );
    const { realtime } = useRuntime();
    $effect(() => {
        if (data.comment.list instanceof Promise) {
            data.comment.list.then((v) => (commentList = v));
        } else {
            commentList = data.comment.list;
        }
    });

    onMount(() => {
        let subscription: Subscription | undefined = undefined;
        (async () => {
            const subscribeResult = await realtime.subscribe(
                `issues.${$page.params['issueId']}.comments.created`
            );
            if (!subscribeResult.isOk()) {
                return;
            }
            subscription = subscribeResult.value;
            for await (const message of subscription) {
                const data = message.json<{ issueCommentId: string }>();
                if (commentList.items.length !== commentList.totalCount) {
                    addToast({
                        data: {
                            title: 'New comment',
                            description:
                                'A user has added a comment on this issue. Scroll down to see it'
                        }
                    });
                } else {
                    const tryFetch = await tryPromise(
                        fetch(`/api/issue-comments/${data.issueCommentId}`, {
                            method: 'get'
                        })
                    );
                    if (tryFetch.isErr() || !tryFetch.value.ok) {
                        return;
                    }
                    const tryDecode = await tryPromise(tryFetch.value.json<IssueComment>());
                    if (tryDecode.isOk()) {
                        commentList = paginatedList({
                            items: [...commentList.items, tryDecode.value],
                            totalCount: commentList.totalCount + 1
                        });
                    }
                }
            }
        })();
        return () => {
            subscription?.unsubscribe();
        };
    });

    $effect(() => {
        if (!editor) return;

        function handle({ editor }: { editor: Editor }) {
            validation = clientValidate({
                editor,
                issueId: $page.params['issueId']
            });
        }

        editor.on('create', handle);
        editor.on('update', handle);

        return () => {
            editor!.off('create', handle);
            editor!.off('update', handle);
        };
    });
</script>

<main class="relative h-full overflow-auto">
    <div class="relative mx-auto max-w-paragraph-lg p-4">
        <h4 class="font-bold content-center">
            {data.issue.title}
            <span class="text-base-fg-3/60 font-normal">
                #{data.issue.orderNumber}
            </span>
        </h4>
        <Issue {form} isEditing={data.isEditing} issue={data.issue} />
        <h6 class="mt-4 font-bold">Activity</h6>
        {#if commentList.items.length}
            <ol class="mt-4 space-y-8 pt-2">
                {#each commentList.items as comment (comment.id)}
                    <li class="w-full">
                        <Comment
                            {comment}
                            isAuthor={comment.authorId === data.user.id}
                            isEditing={comment.id === data.editingCommentId}
                        />
                    </li>
                {/each}
            </ol>
        {/if}
        <div class="sticky mt-8 bottom-2">
            <form
                method="post"
                action="?/comment"
                class="space-y-2"
                use:enhance={(e) => {
                    if (!editor) {
                        e.cancel();
                        return;
                    }
                    e.formData.set('content', editor.getHTML());
                    return async ({ update }) => {
                        await update({ invalidateAll: false, reset: true });
                    };
                }}
            >
                <input type="hidden" name="issueId" value={$page.params['issueId']} />
                <div class="relative">
                    <Tiptap
                        bind:editor
                        placeholder="Write your comment..."
                        editorProps={{
                            class: 'bg-base-1 min-h-24 max-h-60'
                        }}
                    />
                    <Button
                        variant="primary"
                        class="absolute p-1 bottom-2 right-3 block ml-auto w-fit"
                        filled={false}
                        outline
                        disabled={validation && !validation.ok}
                    >
                        <Icon name="arrow-up" />
                    </Button>
                </div>
            </form>
        </div>
    </div>
</main>
