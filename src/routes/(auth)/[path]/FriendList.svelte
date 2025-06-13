<script lang="ts">
    import { enhance } from '$app/forms';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Avatar, IconButton, Input, toast } from '~/lib/components';
    import { IconSearch, IconTrash } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { Asset } from '~/lib/models/asset';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { stringifyActionFailureErrors } from '~/lib/utils/kit.client';
    import { QueryResponse } from '~/lib/utils/query';

    interface LocalUser {
        id: string;
        email: string;
        profile?: {
            name: string;
            displayName: string;
            image: Partial<Asset>;
        };
    }

    const { userId }: { userId: string } = $props();
    const { api, cloudinary, queryClient } = useRuntime();
    const params = $derived({
        userId,
        friendId: userId,
        select: 'CreatedTime,Friend.Id,Friend.Email,Friend.Profile.Name,Friend.Profile.DisplayName,Friend.Profile.Image,User.Id,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image',
        size: 5
    });
    const queryKey = $derived([
        'user-friends',
        {
            userId,
            params
        }
    ]);
    const query = createQuery(
        toStore(() => ({
            queryKey,
            queryFn: async () => {
                const response = await QueryResponse.HTTP(() =>
                    api.get(`user-friends`, {
                        query: params
                    })
                );
                return await QueryResponse.JSON(() =>
                    response.json<
                        PaginatedList<{
                            user: LocalUser;
                            friend: LocalUser;
                        }>
                    >()
                );
            }
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

{#snippet friend(user: LocalUser)}
    <div
        class={[
            'relative flex items-center gap-2 p-2',
            user.profile ? 'hover:bg-base-hover active:bg-base-active rounded' : undefined
        ]}
    >
        {#if user.profile}
            <a
                href="/profiles/{user.profile.name}"
                aria-labelledby="friendlist-{user.id}"
                class="absolute inset-0"
            ></a>
        {/if}
        <Avatar
            src={imageFromAsset(cloudinary)(user.profile?.image)?.resize(Resize.fill(64)).toURL()}
            seed={user.profile?.name ?? user.email}
            class="size-avatar-sm"
        />
        <span id="friendlist-{user.id}">
            {#if user.profile}
                {user.profile.displayName} <span class="text-base-fg-5">({user.profile.name})</span>
            {:else}
                {user.email}
            {/if}
        </span>
        <form
            method="post"
            action="/actions?/delete_friend"
            class="ml-auto"
            use:enhance={() => {
                const old = $query.data;
                if (old) {
                    queryClient.setQueryData(queryKey, {
                        items: old.items.filter(
                            (a) => a.user.id !== user.id && a.friend.id !== user.id
                        ),
                        totalCount: old.totalCount - 1
                    });
                }
                return async (e) => {
                    if (e.result.type === 'failure') {
                        toast({
                            type: 'negative',
                            header: 'Failed to remove friend',
                            body: `Something went wrong while removing ${user.profile?.displayName ?? user.email} from your friends list.`,
                            footer: stringifyActionFailureErrors(
                                e.result.data!.errors as Record<string, string[]>
                            )
                        });
                        queryClient.setQueryData(queryKey, old);
                    } else if (e.result.type === 'success') {
                        toast({
                            type: 'positive',
                            header: 'Friend removed',
                            body: `${user.profile?.displayName ?? user.email} removed successfully from your friends list.`
                        });
                    }
                    await e.update();
                };
            }}
        >
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="friendId" value={user.id} />
            <IconButton type="submit" variant="negative">
                <IconTrash />
            </IconButton>
        </form>
    </div>
{/snippet}

<div class="p-2">
    <div class="mb-2 flex items-center justify-between gap-2">
        <div class="relative grow">
            <Input
                type="text"
                placeholder="Search for friends..."
                class="w-full bg-transparent pl-8 pr-2"
            />
            <IconSearch class="text-base-fg-ghost absolute left-2 top-1/2 -translate-y-1/2" />
        </div>
    </div>
    <div>
        {#if $query.isPending}
            {@render skeleton()}
        {:else if $query.data == null || $query.data.items.length === 0}
            <p class="c-label mt-2">No friends found.</p>
        {:else}
            <ol>
                {#each $query.data.items as userFriend (userFriend.user.id === userId ? userFriend.friend.id : userFriend.user.id)}
                    <li>
                        {@render friend(
                            userFriend.user.id === userId ? userFriend.friend : userFriend.user
                        )}
                    </li>
                {/each}
            </ol>
        {/if}
    </div>
</div>
