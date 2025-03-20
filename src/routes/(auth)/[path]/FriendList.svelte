<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Avatar, Input } from '~/lib/components';
    import { IconSearch } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { Asset } from '~/lib/models/asset';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { QueryResponse } from '~/lib/utils/query';

    interface LocalFriend {
        id: string;
        email: string;
        profile?: {
            name: string;
            displayName: string;
            image: Partial<Asset>;
        };
    }

    const { userId }: { userId: string } = $props();
    const { api, cloudinary } = useRuntime();
    const select =
        'CreatedTime,Friend.Id,Friend.Email,Friend.Profile.Name,Friend.Profile.DisplayName,Friend.Profile.Image';
    const query = createQuery(
        toStore(() => ({
            queryKey: [
                'user-friends',
                {
                    userId,
                    params: {
                        select
                    }
                }
            ],
            queryFn: async () => {
                const response = await QueryResponse.HTTP(() =>
                    api.get(`user-friends`, { query: { userId, friendId: userId, select } })
                );
                return await QueryResponse.JSON(() =>
                    response.json<
                        PaginatedList<{
                            friend: LocalFriend;
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

{#snippet friend(friend: LocalFriend)}
    <div class="flex items-center gap-2 py-2">
        <Avatar
            src={imageFromAsset(cloudinary)(friend.profile?.image)?.resize(Resize.fill(64)).toURL()}
            seed={friend.profile?.name ?? friend.email}
            class="size-avatar-sm"
        />
        {friend.email}
    </div>
{/snippet}

<div class="p-2">
    <div class="mb-2 flex items-center justify-between gap-2">
        <div class="relative grow">
            <Input
                type="text"
                placeholder="Search for friends..."
                class="w-full border-none py-0 pl-6 pr-0 outline-none ring-0"
            />
            <IconSearch class="text-base-fg-ghost absolute left-0 top-1/2 -translate-y-1/2" />
        </div>
    </div>
    <div>
        {#if $query.isPending}
            {@render skeleton()}
        {:else if $query.data == null || $query.data.items.length === 0}
            <p class="c-label mt-2">No friends found.</p>
        {:else}
            <ol>
                {#each $query.data.items as userFriend (userFriend.friend.id)}
                    <li>
                        {@render friend(userFriend.friend)}
                    </li>
                {/each}
            </ol>
        {/if}
    </div>
</div>
