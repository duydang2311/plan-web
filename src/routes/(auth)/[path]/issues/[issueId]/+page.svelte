<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/stores';
    import { A, pipe } from '@mobily/ts-belt';
    import { createInfiniteQuery } from '@tanstack/svelte-query';
    import { createVirtualizer } from '@tanstack/svelte-virtual';
    import type { Subscription } from 'nats.ws';
    import { onMount, tick, untrack } from 'svelte';
    import { fade } from 'svelte/transition';
    import { addToast } from '~/lib/components';
    import Spinner from '~/lib/components/Spinner.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { IssueComment } from '~/lib/models/issue_comment';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { TE } from '~/lib/utils/functional';
    import { createAsyncEffect, createEffect } from '~/lib/utils/runes.svelte';
    import { paginatedQuery, queryParams } from '~/lib/utils/url';
    import type { ActionData, PageData } from './$types';
    import AddComment from './AddComment.svelte';
    import Comment from './Comment.svelte';
    import Issue from './Issue.svelte';
    import Priority from './Priority.svelte';
    import Status from './Status.svelte';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    const { realtime, httpClient } = useRuntime();
    const commentQuery = paginatedQuery(queryParams($page.url, { offset: 0, size: 10 }));
    const queryKey = ['comments', { issueId: $page.params['issueId'], size: commentQuery.size }];
    const query = createInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam }) => {
            return pipe(
                TE.fromPromise(() =>
                    httpClient.get(`/api/issues/${$page.params['issueId']}/comments`, {
                        query: {
                            offset: pageParam,
                            size: commentQuery.size,
                            select: 'CreatedTime,UpdatedTime,Id,Content,AuthorId'
                        }
                    })
                )(),
                TE.flatMap((r) =>
                    r.ok
                        ? TE.fromPromise(() => r.json<PaginatedList<IssueComment>>())()
                        : TE.leftVoid
                ),
                TE.flatMap((r) => (r.items.length === 0 ? TE.leftVoid : TE.right(r))),
                TE.match(
                    () => null,
                    (r) => {
                        const url = new URL($page.url);
                        const totalSize = pageParam + r.items.length;
                        url.searchParams.set('offset', pageParam + '');
                        replaceState(url, $page.state);
                        return {
                            ...r,
                            nextOffset: totalSize >= r.totalCount ? null : totalSize
                        };
                    }
                )
            )();
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage?.nextOffset
    });

    let scrollEl = $state<HTMLElement>();
    let virtualListEl = $state.raw<HTMLDivElement>();
    let virtualItemEls = $state<HTMLDivElement[]>([]);
    const comments = $derived(
        $query.data
            ? pipe(
                  $query.data.pages,
                  A.filter((a) => a != null),
                  A.flatMap((a) => a.items)
              )
            : []
    );

    const virtualizer = $derived(
        scrollEl && virtualListEl
            ? createVirtualizer<HTMLElement, HTMLDivElement>({
                  count: 0,
                  getScrollElement: () => scrollEl!,
                  estimateSize: () => 130,
                  getItemKey: (index) => untrack(() => comments[index]?.id) ?? 'load-more',
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
        () => [...virtualItemEls]
    );

    createEffect(
        () => {
            $virtualizer!.measure();
        },
        () => $query
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
        () => $virtualizer
    );
</script>

<main class="flex items-stretch h-full divide-x divide-base-border-2 overflow-hidden">
    <div class="grow relative h-full overflow-auto" bind:this={scrollEl} style="contain: strict;">
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
                                {#each items as row, idx (comments[row.index]?.id ?? 'load-more')}
                                    <div
                                        bind:this={virtualItemEls[idx]}
                                        data-index={row.index}
                                        class="pt-4 pb-2 first:pt-4 border-b border-b-base-border-2"
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
                <AddComment userId={data.user.id} size={commentQuery.size} />
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
