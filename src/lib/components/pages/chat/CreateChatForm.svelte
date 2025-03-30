<script lang="ts">
    import { enhance } from '$app/forms';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { debounce } from '@mobily/ts-belt/Function';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Avatar, Button, Field, Input, Label, toast } from '~/lib/components';
    import { IconChat } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { User, UserProfile } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { QueryResponse } from '~/lib/utils/query';

    type LocalUser = Pick<User, 'id' | 'email'> & {
        profile?: Pick<UserProfile, 'name' | 'displayName' | 'image'>;
    };
    interface LocalUserFriend {
        user: LocalUser;
        friend: LocalUser;
    }

    const { userId }: { userId: string } = $props();

    let search = $state.raw('');
    const { api, cloudinary, queryClient } = useRuntime();
    const setSearch = debounce((a: string) => {
        search = a;
    }, 200);
    const select =
        'CreatedTime,User.Id,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image,Friend.Id,Friend.Email,Friend.Profile.Name,Friend.Profile.DisplayName,Friend.Profile.Image';
    const query = createQuery(
        toStore(() => {
            return {
                queryKey: ['user-friends', { query: search }],
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        search.length === 0
                            ? api.get('user-friends', {
                                  query: { userId, friendId: userId, select, size: 5 }
                              })
                            : api.get('user-friends/search', {
                                  query: { userId, query: search, select, size: 5 }
                              })
                    );
                    return await QueryResponse.JSON(() =>
                        response.json<PaginatedList<LocalUserFriend>>()
                    );
                },
                placeholderData: keepPreviousData
            };
        })
    );
    let selectedUsers = $state.raw<LocalUser[]>([]);
</script>

{#snippet friend(user: LocalUser)}
    {#if user.profile != null}
        <a
            href="/profiles/{user.profile.name}"
            class="absolute inset-0"
            aria-labelledby="create-chat-form-{user.id}"
        ></a>
    {/if}
    <Avatar
        src={imageFromAsset(cloudinary)?.(user.profile?.image)?.resize(Resize.fill(64)).toURL()}
        seed={user.profile?.name ?? user.email}
        class="size-avatar-sm"
    />
    <p id="create-chat-form-{user.id}">
        {#if user.profile}
            {user.profile.displayName} <span class="text-base-fg-ghost">({user.profile.name})</span>
        {:else}
            {user.email}
        {/if}
    </p>
    <input
        type="checkbox"
        class="isolate block"
        checked={selectedUsers.some((a) => a.id === user.id)}
        oninput={(e) => {
            if (e.currentTarget.checked) {
                selectedUsers = [...selectedUsers, user];
            } else {
                selectedUsers = selectedUsers.filter((a) => a.id !== user.id);
            }
        }}
    />
{/snippet}

<form
    method="post"
    action="/actions?/create_chat"
    use:enhance={() => {
        return async ({ result }) => {
            if (result.type === 'failure') {
                toast({ type: 'negative', body: 'An error occurred while creating chat.' });
            } else if (result.type === 'success') {
                toast({ type: 'positive', body: 'Chat created successfully.' });
            }
            await queryClient.invalidateQueries({ queryKey: ['chats'] });
        };
    }}
>
    {#each selectedUsers as user (user.id)}
        <input type="hidden" name="memberIds[]" value={user.id} />
    {/each}
    <div class="flex items-center justify-between">
        <h2>Create chat</h2>
        <div class="relative">
            <IconChat class="text-base-fg-1 size-8" />
        </div>
    </div>
    <p class="c-label mb-4">
        You can create chat with a friend or a group chat with multiple friends.
    </p>
    <div class="space-y-4">
        <Field>
            <Label for="search">Username, or email address</Label>
            <div class="c-input flex flex-wrap gap-2">
                {#each selectedUsers as user (user.id)}
                    <button
                        type="button"
                        class="bg-base-4 border-base-border-3 w-fit flex-1 basis-20 rounded-sm border px-1"
                        onclick={() => {
                            selectedUsers = selectedUsers.filter((a) => a.id !== user.id);
                        }}
                    >
                        {user.profile?.displayName ?? user.email}
                    </button>
                {/each}
                <Input
                    id="search"
                    type="text"
                    placeholder={selectedUsers.length === 0
                        ? 'e.g. user01, user@gmail.com'
                        : undefined}
                    autofocus
                    oninput={(e) => {
                        setSearch(e.currentTarget.value);
                    }}
                    class="w-fit flex-1 basis-20 rounded-none border-0 border-b p-0"
                />
            </div>
        </Field>
        {#if $query.data && $query.data.items.length > 0}
            <ol class="grid grid-cols-[auto_1fr_auto] gap-2">
                {#each $query.data.items as userFriend (userFriend.user.id === userId ? userFriend.friend.id : userFriend.user.id)}
                    <li class="relative col-span-full grid grid-cols-subgrid items-center">
                        {@render friend(
                            userFriend.user.id === userId ? userFriend.friend : userFriend.user
                        )}
                    </li>
                {/each}
            </ol>
        {/if}
        <Button variant="primary">Create Chat</Button>
    </div>
</form>
