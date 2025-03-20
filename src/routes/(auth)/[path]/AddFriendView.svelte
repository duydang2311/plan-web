<script lang="ts">
    import { enhance } from '$app/forms';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { debounce } from '@mobily/ts-belt/Function';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Avatar, Field, IconButton, Input, Label, toast } from '~/lib/components';
    import { IconSearch, IconUserPlus } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { User } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { QueryResponse } from '~/lib/utils/query';

    type SearchUser = Pick<User, 'id' | 'email'> & {
        profile?: Pick<NonNullable<User['profile']>, 'name' | 'displayName' | 'image'>;
    };

    const { userId }: { userId: string } = $props();
    const { cloudinary, api, queryClient } = useRuntime();
    let search = $state.raw('');
    let updateSearch = debounce((a: string) => {
        search = a;
    }, 300);
    let temp = $state.raw<string>();
    const queryParams = $derived({
        query: search,
        select: 'Id,Email,Profile.Name,Profile.DisplayName,Profile.Image',
        excludeFriendsWithUserId: userId,
        excludeFriendRequestedWithUserId: userId
    });
    const queryKey = $derived([
        'users',
        {
            tag: 'add-friend-view',
            queryParams
        }
    ]);
    const query = createQuery(
        toStore(() => {
            return {
                queryKey,
                queryFn: async () => {
                    if (search.length === 0) {
                        return undefined;
                    }

                    const response = await QueryResponse.HTTP(() =>
                        api.get('users/search', {
                            query: queryParams
                        })
                    );
                    return await QueryResponse.JSON(() =>
                        response.json<PaginatedList<SearchUser>>()
                    );
                },
                enabled: search.length > 0,
                placeholderData: keepPreviousData
            };
        })
    );
</script>

{#snippet skeleton()}
    <div class="mt-2 animate-pulse">
        {#each { length: 3 } as _}
            <div class="flex items-center gap-2 py-2">
                <div class="size-avatar-sm bg-base-3 rounded-full"></div>
                <div class="bg-base-3 h-5 grow"></div>
            </div>
        {/each}
    </div>
{/snippet}

{#snippet searchUser(user: SearchUser)}
    {#if user.profile}
        <a
            class="absolute inset-0"
            href="/profiles/{user.profile.name}"
            aria-labelledby="search-user-{user.id}"
        ></a>
    {/if}
    <Avatar
        src={imageFromAsset(cloudinary)(user.profile?.image)?.resize(Resize.fill(64)).toURL()}
        seed={user.profile?.name ?? user.email}
        class="size-avatar-sm"
    />
    <div id="search-user-{user.id}">
        {#if user.profile}
            <span>{user.profile.displayName}</span>
            <span class="text-base-fg-ghost">({user.profile.name})</span>
        {:else}
            {user.email}
        {/if}
    </div>
    <form
        method="post"
        action="/actions?/add_friend"
        class="flex items-center"
        use:enhance={async () => {
            const data = $query.data;
            if (data) {
                queryClient.setQueryData(queryKey, {
                    items: data.items.filter((a) => a.id !== user.id),
                    totalCount: data.totalCount
                });
            }
            return async ({ result }) => {
                if (result.type === 'success') {
                    toast({
                        type: 'positive',
                        body: success,
                        bodyProps: user.profile?.displayName ?? user.email
                    });
                } else if (result.type === 'failure') {
                    switch (result.status) {
                        case 409:
                            toast({
                                type: 'negative',
                                body: conflictError,
                                bodyProps: user.profile?.displayName ?? user.email
                            });
                            break;
                        default:
                            toast({
                                type: 'negative',
                                body: genericError,
                                bodyProps: user.profile?.displayName ?? user.email
                            });
                            break;
                    }
                }

                if ($query.data) {
                    queryClient.setQueryData(queryKey, {
                        items: $query.data.items.map((a) =>
                            a.id === user.id ? { ...a, status: undefined } : a
                        ),
                        totalCount: $query.data.totalCount
                    });
                }
                await queryClient.invalidateQueries({
                    predicate: ({ queryKey }) => {
                        return (
                            queryKey[0] === 'user-friend-requests' ||
                            (queryKey[0] === 'users' &&
                                queryKey[1] != null &&
                                typeof queryKey[1] === 'object' &&
                                'tag' in queryKey[1] &&
                                queryKey[1].tag === 'add-friend-view')
                        );
                    }
                });
            };
        }}
    >
        <input type="hidden" name="senderId" value={userId} />
        <input type="hidden" name="receiverId" value={user.id} />
        <IconButton type="submit" variant="positive" title="Add friend" class="isolate size-6">
            <IconUserPlus class="size-full" />
        </IconButton>
    </form>
{/snippet}

{#snippet success(name: string)}
    <span>Friend request successfully sent to <strong>{name}</strong>.</span>
{/snippet}

{#snippet conflictError(name: string)}
    <span>A friend request has already been sent to <strong>{name}</strong>.</span>
{/snippet}

{#snippet genericError(name: string)}
    <span>An error occurred while sending a friend request to <strong>{name}</strong>.</span>
{/snippet}

<div class="p-2">
    <Field>
        <Label for="search">Search by username, or email address</Label>
        <div class="relative">
            <Input
                type="text"
                id="search"
                placeholder="Find people"
                class="pl-8"
                autofocus
                oninput={(e) => {
                    updateSearch(e.currentTarget.value);
                }}
            />
            <IconSearch class="text-base-fg-ghost absolute left-2 top-1/2 -translate-y-1/2" />
        </div>
    </Field>
    {#if $query.isPending}
        {#if search.length > 0}
            {@render skeleton()}
        {/if}
    {:else if $query.data == null || $query.data.items.length === 0}
        <p class="c-label mt-2">No users found.</p>
    {:else}
        {temp}
        <ol class="mt-2 grid grid-cols-[auto_1fr_auto]" class:animate-pulse={$query.isFetching}>
            {#each $query.data.items as user (user.id)}
                <li
                    class="hover:bg-base-hover relative col-span-full grid
                        grid-cols-subgrid items-center gap-2 rounded p-2"
                >
                    {@render searchUser(user)}
                </li>
            {/each}
        </ol>
    {/if}
</div>
