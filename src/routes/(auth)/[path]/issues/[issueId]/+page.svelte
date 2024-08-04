<script lang="ts">
    import { enhance } from '$app/forms';
    import { page } from '$app/stores';
    import { Editor } from '@tiptap/core';
    import { Effect, Fiber, pipe, Stream } from 'effect';
    import { onMount } from 'svelte';
    import Button from '~/lib/components/Button.svelte';
    import Icon from '~/lib/components/Icon.svelte';
    import Tiptap from '~/lib/components/Tiptap.svelte';
    import { addToast } from '~/lib/components/Toaster.svelte';
    import { setRuntime } from '~/lib/contexts/runtime.client';
    import type { ValidationResult } from '~/lib/utils/validation';
    import type { ActionData, PageData } from './$types';
    import Comment from './Comment.svelte';
    import Issue from './Issue.svelte';
    import { clientValidate, newCommentsStream } from './utils.client';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    const runtime = setRuntime();
    let editor = $state<Editor>();
    let validation = $state<ValidationResult>();

    onMount(() => {
        const fiber = runtime.runFork(
            pipe(
                newCommentsStream($page.params['issueId']),
                Stream.runForEach((a) =>
                    Effect.tryPromise(async () => {
                        const list = await data.commentList;
                        console.log(list.items.length, list.totalCount);
                        if (list.items.length !== list.totalCount) {
                            addToast({
                                data: {
                                    title: 'New comment',
                                    description:
                                        'A user has added a comment on this issue. Scroll down to see it'
                                }
                            });
                        } else {
                            console.log('fetching new comment', a);
                        }
                    })
                ),
                Effect.scoped
            )
        );
        return () => {
            runtime.runFork(Fiber.interrupt(fiber));
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
        {#await data.commentList then list}
            {#if list.items.length}
                <ol class="mt-4 space-y-8 pt-2">
                    {#each list.items as comment}
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
        {/await}
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
                        class="min-h-20 max-h-60 bg-base-1"
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
