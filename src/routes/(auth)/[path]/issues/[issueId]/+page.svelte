<script lang="ts">
    import { enhance } from '$app/forms';
    import { replaceState } from '$app/navigation';
    import { page } from '$app/stores';
    import { A, pipe } from '@mobily/ts-belt';
    import { createInfiniteQuery } from '@tanstack/svelte-query';
    import { createVirtualizer } from '@tanstack/svelte-virtual';
    import { Editor } from '@tiptap/core';
    import type { Subscription } from 'nats.ws';
    import { onMount, tick, untrack } from 'svelte';
    import { fade } from 'svelte/transition';
    import { Button, Icon, Tiptap, addToast } from '~/lib/components';
    import Spinner from '~/lib/components/Spinner.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { createAsyncEffect, createEffect } from '~/lib/utils/runes.svelte';
    import { paginatedQuery, queryParams } from '~/lib/utils/url';
    import type { ValidationResult } from '~/lib/utils/validation';
    import type { ActionData, PageData } from './$types';
    import Comment from './Comment.svelte';
    import Issue from './Issue.svelte';
    import Priority from './Priority.svelte';
    import Status from './Status.svelte';
    import { clientValidate, fetchCommentList } from './utils.client';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    const { realtime } = useRuntime();
    let editor = $state<Editor>();
    let validation = $state<ValidationResult>();
    const commentQuery = paginatedQuery(queryParams($page.url, { offset: 0, size: 10 }));
    const query = createInfiniteQuery({
        queryKey: ['comments', { issueId: $page.params['issueId'], size: commentQuery.size }],
        queryFn: async ({ pageParam }) => {
            const result = await fetchCommentList({
                issueId: $page.params['issueId'],
                offset: pageParam,
                size: commentQuery.size
            });

            if (result.isOk() && result.value) {
                const url = new URL($page.url);
                url.searchParams.set('offset', pageParam + '');
                replaceState(url, $page.state);
                return result.value;
            }
            return null;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage?.nextOffset
    });

    let scrollEl = $state<HTMLElement>();
    let virtualListEl = $state<HTMLDivElement>();
    let virtualItemEls = $state<HTMLDivElement[]>([]);
    const comments = $derived(
        $query.data
            ? pipe(
                  $query.data.pages,
                  A.filter((a) => a != null),
                  A.flatMap((a) => a?.items)
              )
            : []
    );
    const virtualizer = $derived(
        scrollEl && virtualListEl
            ? createVirtualizer<HTMLElement, HTMLDivElement>({
                  count: 0,
                  getScrollElement: () => scrollEl!,
                  estimateSize: () => 145,
                  getItemKey: (index) => untrack(() => comments[index]?.id) ?? 'loading-more',
                  overscan: 4,
                  scrollMargin: virtualListEl.offsetTop ?? 0
              })
            : null
    );
    let items = $derived($virtualizer?.getVirtualItems());

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

    createEffect(
        () => {
            $virtualizer?.setOptions({
                count: $query.hasNextPage ? comments.length + 1 : comments.length
            });
        },
        () => $query
    );

    createEffect(
        () => {
            for (const el of virtualItemEls) {
                $virtualizer!.measureElement(el);
            }
        },
        () => [virtualItemEls, $query]
    );

    createAsyncEffect(
        () => {
            const lastItem = $virtualizer?.getVirtualItems().at(-1);
            if (
                lastItem &&
                lastItem.index > comments.length - 1 &&
                $query.hasNextPage &&
                !$query.isFetchingNextPage
            ) {
                return $query.fetchNextPage();
            }
        },
        () => [$virtualizer, $query]
    );

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

<main class="flex items-stretch h-full divide-x divide-base-border overflow-hidden">
    <div class="grow relative h-full overflow-auto" bind:this={scrollEl}>
        <div class="flex flex-col min-h-full relative mx-auto max-w-paragraph-lg p-4">
            <p class="font-bold content-center text-base-fg-1 text-h1">
                {data.issue.title}
                <span class="text-base-fg-3/60 font-normal">
                    #{data.issue.orderNumber}
                </span>
            </p>
            <Issue {form} isEditing={data.isEditing} issue={data.issue} />
            <p class="mt-8 font-bold text-base-fg-1 text-h4">Activity</p>
            <div bind:this={virtualListEl}>
                {#if $virtualizer}
                    <div
                        style="position: relative; height: {$virtualizer.getTotalSize()}px; width: 100%;"
                    >
                        {#if items}
                            <div
                                style="position: absolute; top: 0; left: 0; width: 100%; transform: translateY({items[0]
                                    ? items[0].start - $virtualizer.options.scrollMargin
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
                                                    <Spinner
                                                        class="size-8 text-primary-1 mx-auto"
                                                    />
                                                    Loading more...
                                                {/if}
                                            </div>
                                        {:else}
                                            {@const comment = comments[row.index]}
                                            <Comment
                                                {comment}
                                                isAuthor={comment.authorId === data.user.id}
                                                size={commentQuery.size}
                                            />
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
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
    </div>
    <div class="hidden xl:block w-full max-w-60 p-4 h-full">
        <p class="font-medium font-display text-base-fg-3 mb-4">Properties</p>
        <div class="space-y-2">
            <Status workspaceId={data.workspace.id} issueId={data.issue.id} />
            <Priority issueId={data.issue.id} />
        </div>
    </div>
</main>
