<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { createInfiniteQuery, type InfiniteData } from '@tanstack/svelte-query';
    import DOMPurify from 'isomorphic-dompurify';
    import type { Subscription } from 'nats.ws';
    import { onMount } from 'svelte';
    import { toStore } from 'svelte/store';
    import invariant from 'tiny-invariant';
    import { Virtualizer, type VListHandle } from 'virtua/svelte';
    import { Avatar } from '~/lib/components';
    import ChatInput from '~/lib/components/pages/chat/ChatInput.svelte';
    import RelativeTime from '~/lib/components/RelativeTime.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { ChatMessage } from '~/lib/models/chat';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { User, UserPreset, UserProfile } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { QueryResponse } from '~/lib/utils/query';
    import { watch } from '~/lib/utils/runes.svelte';
    import { tryPromise } from '~/lib/utils/try';

    export type LocalChatMessage = Pick<ChatMessage, 'id' | 'createdTime' | 'content'> & {
        sender: Pick<User, 'id' | 'email'> & {
            profile: Pick<UserProfile, 'name' | 'displayName' | 'image'>;
        };
    };

    const { chatId, user }: { chatId: string; user: UserPreset['basicProfile'] } = $props();
    const { api, cloudinary, realtime, queryClient } = useRuntime();
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
    let virtualHandle = $state.raw<VListHandle>();
    let scrollRef = $state.raw<HTMLElement>();
    let atBottom = true;
    let shift = $state.raw(false);

    const getChatMessage = async (chatMessageId: number) => {
        const tryGet = await tryPromise(() =>
            api.get(`chat-messages/${chatMessageId}`, { query: { select } })
        )();

        if (!tryGet.ok || !tryGet.data.ok) {
            return;
        }

        const tryJson = await tryPromise(() => tryGet.data.json<LocalChatMessage>())();
        if (!tryJson.ok) {
            return;
        }

        queryClient.setQueryData<InfiniteData<PaginatedList<LocalChatMessage>>>(queryKey, (a) => {
            if (!a) {
                return a;
            }

            const size = 20;
            const all = [tryJson.data, ...a.pages.flatMap((a) => a.items)].toSorted(
                (a, b) => b.id - a.id
            );
            const partitions = Array(Math.ceil(all.length / size))
                .fill(0)
                .map((_, i) => all.slice(i * size, i * size + size));
            return {
                pages: partitions.map((b) => ({
                    items: b,
                    totalCount: (a.pages[0]?.totalCount ?? 0) + 1
                })),
                pageParams: partitions.map((_, i) => {
                    if (i === 0) {
                        return undefined;
                    }
                    return partitions[i - 1].at(-1)?.id;
                })
            };
        });
    };

    watch(() => [virtualHandle, scrollRef])(() => {
        if (!virtualHandle || !scrollRef) {
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

    watch(() => chatId)(() => {
        atBottom = true;
    });

    watch(() => [virtualHandle, messages, atBottom])(() => {
        if (virtualHandle && messages.length && atBottom) {
            virtualHandle.scrollToIndex(messages.length - 1);
            atBottom = false;
        }
    });

    watch(() => [scrollRef, messages])(() => {
        if (!scrollRef) {
            return;
        }
        shift = scrollRef.scrollHeight > scrollRef.clientHeight;
    });

    onMount(() => {
        let subscription: Subscription | undefined;
        (async () => {
            const trySubscribe = await realtime.subscribe(`chats.${chatId}.messages.created`);
            if (trySubscribe.isErr()) {
                return;
            }
            subscription = trySubscribe.value;
            for await (const msg of subscription) {
                const json = msg.json<{ chatMessageId: number }>();
                invariant(
                    typeof json.chatMessageId === 'number',
                    'json.chatMessageId must be a number'
                );
                if (messages.some((a) => a.id === json.chatMessageId)) {
                    continue;
                }
                getChatMessage(json.chatMessageId);
            }
        })();
        return () => {
            subscription?.unsubscribe();
        };
    });
</script>

{#snippet messageSnippet(message: LocalChatMessage)}
    {@const isUser = message.sender.id === user.id}
    <div
        class="max-w-3/4 flex w-fit items-end gap-2"
        class:ml-auto={isUser}
        class:flex-row-reverse={isUser}
    >
        <Avatar
            src={imageFromAsset(cloudinary)(message.sender.profile?.image)
                ?.resize(Resize.fill(64))
                .toURL()}
            seed={message.sender.profile?.name ?? message.sender.email}
            class="size-avatar-md"
        />
        <div>
            <div
                class={[
                    'w-fit rounded-xl p-2',
                    isUser
                        ? 'bg-primary-3 text-primary-fg-2 ml-auto rounded-br-sm'
                        : 'bg-base-3 dark:bg-base-4 dark:border-base-border-2 rounded-bl-sm'
                ]}
            >
                {@html DOMPurify.sanitize(message.content, {
                    USE_PROFILES: { html: true }
                })}
            </div>
            <p class={['c-label', isUser && 'ml-auto']}>
                {message.sender.profile?.displayName ?? message.sender.email} · <RelativeTime
                    time={message.createdTime}
                />
            </p>
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
                    'w-paragraph-lg bg-base-3 dark:bg-base-4 dark:border-base-border-2 h-16 rounded-xl rounded-bl-sm p-2'
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
    <div class="grid grid-rows-[1fr_auto] overflow-hidden">
        {#if $query.isPending}
            <div>
                {@render skeleton()}
            </div>
        {:else if $query.data == null || messages.length === 0}
            <div>
                <p class="c-label">No messages found.</p>
            </div>
        {:else}
            <div class="h-full overflow-auto px-2 py-1" bind:this={scrollRef}>
                <Virtualizer
                    data={[{ id: 'load-more' }, ...messages]}
                    {scrollRef}
                    getKey={(item) => item.id}
                    horizontal={false}
                    {shift}
                    bind:this={virtualHandle}
                >
                    {#snippet children(message)}
                        {#if message.id === 'load-more'}
                            <div bind:this={loadMoreRef}></div>
                        {:else}
                            <div class="mt-6">
                                {@render messageSnippet(message)}
                            </div>
                        {/if}
                    {/snippet}
                </Virtualizer>
            </div>
        {/if}
        <ChatInput {chatId} {user} />
    </div>
</div>
