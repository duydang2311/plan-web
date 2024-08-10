<script lang="ts">
    import { enhance } from '$app/forms';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { A, pipe } from '@mobily/ts-belt';
    import { createInfiniteQuery } from '@tanstack/svelte-query';
    import { createVirtualizer, type SvelteVirtualizer } from '@tanstack/svelte-virtual';
    import { Editor } from '@tiptap/core';
    import type { Subscription } from 'nats.ws';
    import { onMount, tick, untrack } from 'svelte';
    import { type Readable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { Button, Icon, Tiptap, addToast } from '~/lib/components';
    import Spinner from '~/lib/components/Spinner.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedQuery, queryParams } from '~/lib/utils/url';
    import type { ValidationResult } from '~/lib/utils/validation';
    import type { ActionData, PageData } from './$types';
    import Comment from './Comment.svelte';
    import Issue from './Issue.svelte';
    import { clientValidate, fetchCommentList } from './utils.client';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    const { realtime } = useRuntime();
    let editor = $state<Editor>();
    let validation = $state<ValidationResult>();
    const commentQuery = paginatedQuery(queryParams($page.url, { offset: 0, size: 10 }));
    const query = createInfiniteQuery({
        queryKey: ['comments', { issueId: $page.params['issueId'], size: commentQuery.size }],
        queryFn: async ({ pageParam, signal }) => {
            const result = await fetchCommentList({
                issueId: $page.params['issueId'],
                offset: pageParam,
                size: commentQuery.size,
                signal
            });

            if (result.isOk() && result.value) {
                $page.url.searchParams.set('offset', pageParam + '');
                await goto($page.url, { replaceState: true, noScroll: true });
                return result.value;
            }
            return null;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage?.nextOffset
    });

    let virtualItemEls = $state<HTMLDivElement[]>([]);
    let virtualizer = $state<Readable<SvelteVirtualizer<HTMLElement, HTMLElement>>>();
    let items = $derived($virtualizer?.getVirtualItems());
    const comments = $derived(
        $query.data
            ? pipe(
                  $query.data.pages,
                  A.filter((a) => a != null),
                  A.flatMap((a) => a?.items)
              )
            : []
    );

    function virtualize(node: HTMLElement) {
        virtualizer = createVirtualizer({
            count: 0,
            getScrollElement: () => node,
            estimateSize: (index) => virtualItemEls[index]?.clientHeight ?? 145,
            getItemKey: (index) => comments[index]?.id ?? 'loading-more',
            overscan: 4
        });
    }

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
            for await (const _ of subscription) {
                if ($query.hasNextPage) {
                    addToast({
                        data: {
                            title: '',
                            description: 'A new comment has been added.'
                        }
                    });
                } else {
                    // TODO: use mutation
                    await $query.refetch();
                    await tick();
                    $virtualizer?.measure();
                    $virtualizer?.scrollToIndex(comments.length - 1);
                }
            }
        })();
        return () => {
            subscription?.unsubscribe();
        };
    });

    $effect(() => {
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        comments;
        untrack(() => {
            $virtualizer?.setOptions({
                count: $query.hasNextPage ? comments.length + 1 : comments.length
            });
        });
    });

    $effect(() => {
        for (const el of virtualItemEls) {
            untrack(() => {
                $virtualizer!.measureElement(el);
            });
        }
    });

    $effect(() => {
        const lastItem = $virtualizer?.getVirtualItems().at(-1);
        if (
            lastItem &&
            lastItem.index > comments.length - 1 &&
            $query.hasNextPage &&
            !$query.isFetchingNextPage
        ) {
            $query.fetchNextPage({ cancelRefetch: true });
        }
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

<main class="relative h-full overflow-auto" use:virtualize>
    <div class="flex flex-col min-h-full relative mx-auto max-w-paragraph-lg p-4">
        <p class="font-bold content-center text-base-fg-1 text-h1">
            {data.issue.title}
            <span class="text-base-fg-3/60 font-normal">
                #{data.issue.orderNumber}
            </span>
        </p>
        <Issue {form} isEditing={data.isEditing} issue={data.issue} />
        <p class="mt-8 font-bold text-base-fg-1 text-h4">Activity</p>
        {#if $virtualizer}
            <div style="position: relative; height: {$virtualizer.getTotalSize()}px; width: 100%;">
                {#if items}
                    <div
                        style="position: absolute; top: 0; left: 0; width: 100%; transform: translateY({items[0]
                            ? items[0].start
                            : 0}px);"
                    >
                        {#each items as row, idx (row.index)}
                            <div
                                bind:this={virtualItemEls[idx]}
                                data-index={row.index}
                                class="pt-4 pb-2 first:pt-4 border-b border-b-base-border"
                            >
                                {#if row.index > comments.length - 1}
                                    <div in:fade>
                                        {#if $query.hasNextPage}
                                            <Spinner class="size-8 text-primary-1 mx-auto" />
                                            Loading more...
                                        {/if}
                                    </div>
                                {:else}
                                    {@const comment = comments[row.index]}
                                    <Comment
                                        {comment}
                                        isAuthor={comment.authorId === data.user.id}
                                        isEditing={comment.id === data.editingCommentId}
                                    />
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>
        {/if}
        <div class="mt-8">
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
