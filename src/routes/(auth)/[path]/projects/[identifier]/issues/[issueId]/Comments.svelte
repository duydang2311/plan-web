<script lang="ts">
    import { replaceState } from '$app/navigation';
    import { page } from '$app/stores';
    import { pipe } from '@baetheus/fun/fn';
    import {
        createInfiniteQuery,
        type CreateInfiniteQueryResult,
        type InfiniteData
    } from '@tanstack/svelte-query';
    import { derived as derivedStore, toStore } from 'svelte/store';
    import { Virtualizer } from 'virtua/svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { IssueComment } from '~/lib/models/issue_comment';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { TE } from '~/lib/utils/functional';
    import Comment from './Comment.svelte';

    interface Props {
        authorId: string;
        issueId: string;
        size: number;
        scrollRef: HTMLElement;
    }

    const { authorId, issueId, size, scrollRef }: Props = $props();
    const { api } = useRuntime();
    const queryKey = $derived(['comments', { issueId: issueId, size }]);
    const query: CreateInfiniteQueryResult<InfiniteData<PaginatedList<IssueComment>>> =
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
                    getNextPageParam: (lastPage?: { nextOffset: number | null } | null) =>
                        lastPage?.nextOffset
                })
            )
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

<div bind:this={ref}>
    {#if scrollRef}
        <Virtualizer
            startMargin={ref?.offsetTop ?? 0}
            data={$query.data?.pages.filter((a) => a != null).flatMap((a) => a.items) ?? []}
            getKey={(item) => item.id}
            {scrollRef}
            onscroll={(e) => {
                if (!ref || fetching || !$query.hasNextPage) {
                    return;
                }
                if (e + scrollRef.offsetHeight + 500 > ref.offsetTop + ref.offsetHeight) {
                    fetchNext();
                }
            }}
        >
            {#snippet children(comment)}
                <div class="pt-4 pb-2 first:pt-4 border-b border-b-base-border-2">
                    <Comment {comment} {issueId} isAuthor={comment.authorId === authorId} {size} />
                </div>
            {/snippet}
        </Virtualizer>
    {/if}
</div>
