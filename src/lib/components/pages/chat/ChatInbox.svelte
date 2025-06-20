<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { createInfiniteQuery, type InfiniteData } from '@tanstack/svelte-query';
    import DOMPurify from 'isomorphic-dompurify';
    import { toStore } from 'svelte/store';
    import invariant from 'tiny-invariant';
    import { Virtualizer, type VListHandle } from 'virtua/svelte';
    import { Avatar } from '~/lib/components';
    import ChatInput from '~/lib/components/pages/chat/ChatInput.svelte';
    import RelativeTime from '~/lib/components/RelativeTime.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { UserPreset } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { QueryResponse } from '~/lib/utils/query';
    import { watch } from '~/lib/utils/runes.svelte';
    import {
        getChatMessage,
        infinitizeChatMessageData,
        sortChatMessages,
        type LocalChatMessage
    } from './utils';

    const { chatId, user }: { chatId: string; user: UserPreset['basicProfile'] } = $props();
    const { api, cloudinary, queryClient, hub } = useRuntime();
    const select =
        'Id,CreatedTime,Content,Sender.Id,Sender.Email,Sender.Profile.Name,Sender.Profile.DisplayName,Sender.Profile.Image';
    const queryKey = $derived(['chat-messages', { chatId }]);
    const query = createInfiniteQuery(
        toStore(() => {
            return {
                queryKey,
                queryFn: async ({ pageParam }: { pageParam?: number }) => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get(`chats/${chatId}/messages`, {
                            query: {
                                select,
                                order: '-Id,-CreatedTime',
                                cursor: pageParam
                            }
                        })
                    );

                    return await QueryResponse.JSON(() =>
                        response.json<PaginatedList<LocalChatMessage>>()
                    ).then((a) => ({
                        ...a,
                        nextCursor: a.items.length < 20 ? undefined : a.items.at(-1)?.id
                    }));
                },
                getNextPageParam: (lastPage: { nextCursor?: number }) => {
                    return lastPage.nextCursor;
                },
                initialPageParam: undefined
            };
        })
    );
    const messages = $derived($query.data?.pages.flatMap((a) => a.items).toReversed() ?? []);

    let loadMoreRef = $state.raw<HTMLElement>();
    let virtualizer = $state.raw<VListHandle>();
    let scrollRef = $state.raw<HTMLElement>();
    let dirtyScroll = false;
    let previousScrollHeight = 0;

    watch(() => [virtualizer, scrollRef])(() => {
        if (!virtualizer || !scrollRef) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    $query.hasNextPage &&
                    !$query.isFetchingNextPage &&
                    entries.some((a) => a.target === loadMoreRef && a.isIntersecting)
                ) {
                    $query.fetchNextPage();
                }
            },
            { root: scrollRef, rootMargin: '600px 0px 0px 0px' }
        );

        watch(() => loadMoreRef)(() => {
            const currentLoadMoreRef = loadMoreRef;
            if (!currentLoadMoreRef) {
                return;
            }

            observer.observe(currentLoadMoreRef);
            return () => {
                observer.unobserve(currentLoadMoreRef);
            };
        });
        return () => {
            observer.disconnect();
        };
    });

    watch(() => [messages, virtualizer])(() => {
        if (dirtyScroll || !virtualizer) {
            return;
        }

        virtualizer.scrollToIndex(messages.length - 1);
    });

    watch.pre(() => messages)(() => {
        if (!scrollRef) {
            return;
        }
        previousScrollHeight = scrollRef.scrollHeight;
    });

    watch(() => messages)(() => {
        if (!scrollRef) {
            return;
        }
        if (previousScrollHeight !== scrollRef.scrollHeight) {
            scrollRef.scrollTop += scrollRef.scrollHeight - previousScrollHeight;
            previousScrollHeight = scrollRef.scrollHeight;
        }
    });

    watch(() => chatId)(() => {
        dirtyScroll = false;
    });

    hub.on('new_chat_message', async (data: { ChatMessageId: number; OptimisticId?: string }) => {
        invariant(typeof data.ChatMessageId === 'number', 'data.ChatMessageId must be a number');

        const queryData =
            queryClient.getQueryData<InfiniteData<PaginatedList<LocalChatMessage>>>(queryKey);
        const all = queryData?.pages.flatMap((a) => a.items) ?? [];

        if (all.some((a) => a.id === data.ChatMessageId)) {
            return;
        }

        if (data.OptimisticId) {
            const index = all.findIndex((b) => b.optimisticId === data.OptimisticId);
            if (index !== -1) {
                all[index] = {
                    ...all[index],
                    id: data.ChatMessageId,
                    optimisticId: undefined
                };
                queryClient.setQueryData(
                    queryKey,
                    infinitizeChatMessageData(all, queryData?.pages[0]?.totalCount ?? 0)
                );
                return;
            }
        }

        const getChatMessageAttempt = await getChatMessage(api)(data.ChatMessageId);
        if (!getChatMessageAttempt.ok) {
            return;
        }

        queryClient.setQueryData<InfiniteData<PaginatedList<LocalChatMessage>>>(queryKey, (a) =>
            infinitizeChatMessageData(
                [getChatMessageAttempt.data, ...(a?.pages.flatMap((a) => a.items) ?? [])].toSorted(
                    sortChatMessages
                ),
                (a?.pages[0]?.totalCount ?? 0) + 1
            )
        );
    });
</script>

{#snippet messageSnippet(message: LocalChatMessage)}
    {@const isUser = message.sender.id === user.id}
    <div class={['max-w-3/4 flex w-fit gap-2', isUser && 'ml-auto flex-row-reverse']}>
        <Avatar
            src={imageFromAsset(cloudinary)(message.sender.profile?.image)
                ?.resize(Resize.fill(64))
                .toURL()}
            seed={message.sender.profile?.name ?? message.sender.email}
            class="size-avatar-lg"
        />
        <div>
            <p class={['c-label mb-1', isUser && 'ml-auto']}>
                {message.sender.profile?.displayName ?? message.sender.email} · <RelativeTime
                    time={message.createdTime}
                />
            </p>
            <div
                class={[
                    'prose border-base-border-3 bg-base-1 dark:bg-base-5 prose-li:first:mt-0 prose-li:first:prose-p:mt-0 w-fit rounded-xl border px-4 py-2',
                    isUser ? 'ml-auto rounded-tr-sm' : 'rounded-tl-sm'
                ]}
            >
                {@html DOMPurify.sanitize(message.content, {
                    USE_PROFILES: { html: true }
                })}
            </div>
        </div>
    </div>
{/snippet}

{#snippet skeleton()}
    <ol class="mx-auto flex h-full animate-pulse flex-col-reverse gap-4">
        {@render skeletonMessageRight()}
        {@render skeletonMessageLeft()}
        {@render skeletonMessageLeft()}
        {@render skeletonMessageRight()}
        {@render skeletonMessageLeft()}
        {@render skeletonMessageLeft()}
        {@render skeletonMessageLeft()}
        {@render skeletonMessageRight()}
    </ol>
{/snippet}

{#snippet skeletonMessageLeft()}
    <div class="max-w-3/4 flex w-fit items-end gap-2">
        <div class="size-avatar-md bg-base-3"></div>
        <div>
            <div
                class={[
                    'w-paragraph-lg bg-base-3 dark:bg-base-4 dark:border-base-border-2aaaa h-16 rounded-xl rounded-bl-sm p-2'
                ]}
            ></div>
            <div class="mt-1 flex gap-2">
                <div class="bg-base-4 h-5 w-32 rounded-sm"></div>
            </div>
        </div>
    </div>
{/snippet}

{#snippet skeletonMessageRight()}
    <div class="max-w-3/4 ml-auto flex w-fit flex-row-reverse items-end gap-2">
        <div class="size-avatar-md bg-base-3"></div>
        <div>
            <div
                class={[
                    'bg-primary-1/30 text-primary-fg-2 w-paragraph-lg ml-auto h-16 rounded-xl rounded-br-sm p-2'
                ]}
            ></div>
            <div class="c-label ml-auto mt-1 flex gap-2">
                <div class="bg-primary-1/30 h-5 w-32 rounded-sm"></div>
            </div>
        </div>
    </div>
{/snippet}

<div class="transition-enforcement h-full w-full">
    <div class="bg-base-2 grid grid-rows-[1fr_auto] gap-1 overflow-hidden">
        {#if $query.isPending}
            <div>
                {@render skeleton()}
            </div>
        {:else if $query.data == null || messages.length === 0}
            <div>
                <p class="c-label">No messages found.</p>
            </div>
        {:else}
            <div
                class="h-full overflow-auto px-2 py-1"
                bind:this={scrollRef}
                onscroll={(e) => {
                    const isAtBottom =
                        e.currentTarget.scrollHeight - e.currentTarget.scrollTop <=
                        e.currentTarget.clientHeight + 1;
                    dirtyScroll = !isAtBottom;
                }}
            >
                <Virtualizer
                    data={[{ id: 'load-more' }, ...messages]}
                    {scrollRef}
                    getKey={(item) => item.id ?? item.optimisticId}
                    horizontal={false}
                    bind:this={virtualizer}
                >
                    {#snippet children(message)}
                        {#if message.id === 'load-more'}
                            <div bind:this={loadMoreRef}></div>
                        {:else}
                            <div class="mt-6">
                                {@render messageSnippet(message as LocalChatMessage)}
                            </div>
                        {/if}
                    {/snippet}
                </Virtualizer>
            </div>
        {/if}
        <ChatInput {chatId} {user} />
    </div>
</div>
