<script lang="ts">
    import { enhance } from '$app/forms';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Avatar, IconButton, Input } from '~/lib/components';
    import { IconCheck, IconSearch, IconXMark } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { Asset } from '~/lib/models/asset';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { QueryResponse } from '~/lib/utils/query';

    interface LocalSender {
        id: string;
        email: string;
        profile?: {
            name: string;
            displayName: string;
            image: Partial<Asset>;
        };
    }

    const { userId }: { userId: string } = $props();
    const { queryClient, api, cloudinary } = useRuntime();
    const select =
        'CreatedTime,Sender.Id,Sender.Email,Sender.Profile.Name,Sender.Profile.DisplayName,Sender.Profile.Image';
    const queryKey = $derived([
        'user-friend-requests',
        {
            receiverId: userId,
            params: {
                select
            }
        }
    ]);
    const query = createQuery(
        toStore(() => ({
            queryKey,
            queryFn: async () => {
                const response = await QueryResponse.HTTP(() =>
                    api.get(`user-friend-requests`, { query: { receiverId: userId, select } })
                );
                return await QueryResponse.JSON(() =>
                    response.json<
                        PaginatedList<{
                            sender: LocalSender;
                        }>
                    >()
                );
            },
            staleTime: 0
        }))
    );
</script>

{#snippet skeleton()}
    <div class="animate-pulse">
        {#each { length: 3 } as _}
            <div class="flex items-center gap-2 py-2">
                <div class="size-avatar-sm bg-base-3 rounded-full"></div>
                <div class="bg-base-3 h-5 grow"></div>
            </div>
        {/each}
    </div>
{/snippet}

{#snippet sender(sender: LocalSender)}
    <Avatar
        src={imageFromAsset(cloudinary)(sender.profile?.image)?.resize(Resize.fill(64)).toURL()}
        seed={sender.profile?.name ?? sender.email}
        class="size-avatar-sm"
    />
    <span>
        {sender.email}
    </span>
    <div class="flex gap-2">
        <form
            method="post"
            action="/actions?/accept_friend_request"
            use:enhance={async () => {
                const old = $query.data;
                if (old) {
                    queryClient.setQueryData(queryKey, {
                        items: old.items.filter((a) => a.sender.id !== sender.id),
                        totalCount: old.totalCount - 1
                    });
                }
                return async (e) => {
                    if (e.result.type === 'failure') {
                        queryClient.setQueryData(queryKey, old);
                    }
                    await queryClient.invalidateQueries({
                        predicate: ({ queryKey }) =>
                            queryKey[0] === 'user-friends' || queryKey[0] === 'user-friend-requests'
                    });
                };
            }}
        >
            <input type="hidden" name="senderId" value={sender.id} />
            <input type="hidden" name="receiverId" value={userId} />
            <IconButton type="submit" variant="positive" title="Accept friend request">
                <IconCheck />
            </IconButton>
        </form>
        <form
            method="post"
            action="/actions?/decline_friend_request"
            use:enhance={async () => {
                const old = $query.data;
                if (old) {
                    queryClient.setQueryData(queryKey, {
                        items: old.items.filter((a) => a.sender.id !== sender.id),
                        totalCount: old.totalCount - 1
                    });
                }
                return async (e) => {
                    if (e.result.type === 'failure') {
                        queryClient.setQueryData(queryKey, old);
                    }
                    await queryClient.invalidateQueries({ queryKey });
                };
            }}
        >
            <input type="hidden" name="senderId" value={sender.id} />
            <input type="hidden" name="receiverId" value={userId} />
            <IconButton type="submit" variant="negative" title="Decline friend request">
                <IconXMark />
            </IconButton>
        </form>
    </div>
{/snippet}

<div class="p-2">
    <div class="mb-2 flex items-center justify-between gap-2">
        <div class="relative grow">
            <Input
                type="text"
                placeholder="Search for friend requests..."
                class="w-full bg-transparent pl-8 pr-2"
            />
            <IconSearch class="text-base-fg-ghost absolute left-2 top-1/2 -translate-y-1/2" />
        </div>
    </div>
    <div>
        {#if $query.isPending}
            {@render skeleton()}
        {:else if $query.data == null || $query.data.items.length === 0}
            <p class="c-label mt-2">No friend requests found.</p>
        {:else}
            <ol class="grid grid-cols-[auto_1fr_auto] gap-2">
                {#each $query.data.items as userFriendRequest (userFriendRequest.sender.id)}
                    <li class="col-span-full grid grid-cols-subgrid items-center py-2">
                        {@render sender(userFriendRequest.sender)}
                    </li>
                {/each}
            </ol>
        {/if}
    </div>
</div>
