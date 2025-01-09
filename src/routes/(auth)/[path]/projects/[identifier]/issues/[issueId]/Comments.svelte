<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/state';
    import { pipe } from '@baetheus/fun/fn';
    import {
        createInfiniteQuery,
        type CreateInfiniteQueryResult,
        type InfiniteData
    } from '@tanstack/svelte-query';
    import { cubicInOut } from 'svelte/easing';
    import { derived as derivedStore, toStore } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { Virtualizer } from 'virtua/svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { TE } from '~/lib/utils/functional';
    import type { LocalComment } from './+page.server';
    import Comment from './Comment.svelte';
    import SkeletonComment from './SkeletonComment.svelte';

    interface Props {
        authorId: string;
        issueId: string;
        size: number;
        scrollRef: HTMLElement;
    }

    const { authorId, issueId, size, scrollRef }: Props = $props();
    const { api } = useRuntime();
    const queryKey = $derived(['comments', { issueId: issueId, size }]);
    const query: CreateInfiniteQueryResult<InfiniteData<PaginatedList<LocalComment>>> =
        createInfiniteQuery(
            derivedStore(
                [toStore(() => issueId), toStore(() => queryKey), toStore(() => size)],
                ([$issueId, $queryKey, $size]) => ({
                    queryKey: $queryKey,
                    queryFn: ({ pageParam }: { pageParam: number }) => {
                        return pipe(
                            TE.fromPromise(() =>
                                api.get(`issues/${$issueId}/comments`, {
                                    query: {
                                        offset: pageParam,
                                        size: $size,
                                        select: 'CreatedTime,UpdatedTime,Id,Content,Author.Id,Author.Email,Author.Profile.Image,Author.Profile.Name,Author.Profile.DisplayName'
                                    }
                                })
                            )(),
                            TE.flatMap((r) =>
                                r.ok
                                    ? TE.fromPromise(() => r.json<PaginatedList<LocalComment>>())()
                                    : TE.leftVoid
                            ),
                            TE.flatMap((r) => (r.items.length === 0 ? TE.leftVoid : TE.right(r))),
                            TE.match(
                                () => null,
                                (r) => {
                                    const url = new URL(page.url);
                                    const totalSize = pageParam + r.items.length;
                                    if (pageParam === 0) {
                                        url.searchParams.delete('offset');
                                    } else {
                                        url.searchParams.set('offset', pageParam + '');
                                    }
                                    replaceState(url, page.state);
                                    return {
                                        ...r,
                                        nextOffset: totalSize >= r.totalCount ? null : totalSize
                                    };
                                }
                            )
                        )();
                    },
                    initialPageParam: 0,
                    getNextPageParam: (lastPage?: { nextOffset: number | null } | null) =>
                        lastPage?.nextOffset
                })
            )
        );
    const comments = $derived(
        $query.data?.pages.filter((a) => a != null).flatMap((a) => a.items) ?? []
    );
    let ref = $state<HTMLDivElement>();
    let fetching = false;
    const fetchNext = () => {
        if (!fetching) {
            fetching = true;
            $query.fetchNextPage().finally(() => {
                fetching = false;
            });
        }
    };
</script>

{#if $query.isLoading}
    <div transition:fade={{ duration: 200, easing: cubicInOut }} class="mt-4 space-y-8">
        <SkeletonComment />
        <SkeletonComment />
    </div>
{:else if comments.length > 0}
    <div bind:this={ref} class="mt-4">
        <div class="transition-enforcement">
            <div
                class:animate-twPulse={$query.isFetching}
                transition:fade={{ duration: 200, easing: cubicInOut }}
                class={scrollRef
                    ? '[&>*>*>.comment-wrapper]:mt-4 [&>*>*:first-child>.comment-wrapper]:mt-0'
                    : undefined}
            >
                {#if scrollRef}
                    <Virtualizer
                        startMargin={ref?.offsetTop ?? 0}
                        data={comments}
                        getKey={(item) => item.id}
                        {scrollRef}
                        onscroll={(e) => {
                            if (!ref || fetching || !$query.hasNextPage) {
                                return;
                            }
                            if (
                                e + scrollRef.offsetHeight + 500 >
                                ref.offsetTop + ref.offsetHeight
                            ) {
                                fetchNext();
                            }
                        }}
                    >
                        {#snippet children(comment)}
                            <div class="comment-wrapper">
                                <Comment
                                    {comment}
                                    {issueId}
                                    isAuthor={comment.author.id === authorId}
                                    {size}
                                />
                            </div>
                        {/snippet}
                    </Virtualizer>
                {:else}
                    {#each comments.slice(0, 10) as comment (comment.id)}
                        <div class="mt-4 first:mt-0">
                            <Comment
                                {comment}
                                {issueId}
                                isAuthor={comment.author.id === authorId}
                                {size}
                            />
                        </div>
                    {/each}
                {/if}
            </div>
        </div>
    </div>
{/if}
