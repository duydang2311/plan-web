<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { debounce } from '@mobily/ts-belt/Function';
    import { createMutation, createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { SvelteSet } from 'svelte/reactivity';
    import { toStore } from 'svelte/store';
    import { Avatar, Input } from '~/lib/components';
    import { IconCheck } from '~/lib/components/icons';
    import Select from '~/lib/components/select';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { User, UserPreset } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { when } from '~/lib/utils/runes.svelte';
    import {
        createAssigneeListQuery,
        createAssigneeListQueryKey,
        type LocalIssueAssignee
    } from './utils.client';

    interface Props {
        issueId: string;
        workspaceId: string;
    }

    type LocalUser = UserPreset['basicProfile'] & Pick<User, 'createdTime'>;

    const { issueId, workspaceId }: Props = $props();
    const { api, queryClient, cloudinary } = useRuntime();
    const assigneeListQueryKey = $derived(createAssigneeListQueryKey({ issueId }));
    const assigneeListQuery = createAssigneeListQuery(() => ({ issueId }));

    const value = new SvelteSet<string>($assigneeListQuery.data?.items.map((a) => a.user.id));
    let status = $state.raw<'pending' | null>(null);

    const selectBuilder = new Select.Builder({
        multiple: true,
        open: () => true,
        forceVisible: true,
        value: () => Array.from(value.values()),
        onValueChange: async (next) => {
            for (const a of next.values()) {
                if (value.has(a)) {
                    continue;
                }
                value.add(a);
                const user = queryClient
                    .getQueryData<PaginatedList<LocalUser>>(searchQueryKey)
                    ?.items.find((b) => b.id === a);
                if (user) {
                    await $addMutation.mutateAsync({
                        issueId,
                        user
                    });
                }
            }

            for (const a of value.values()) {
                if (next.has(a)) {
                    continue;
                }
                value.delete(a);
                $deleteMutation.mutate({
                    issueId,
                    userId: a
                });
            }
        }
    });

    let search = $state.raw<string>('');
    const searchQueryKey = $derived(['users', { tag: 'select-assignees', workspaceId, search }]);
    const searchQuery = createQuery<PaginatedList<LocalUser> | null>(
        toStore(() => ({
            queryKey: searchQueryKey,
            queryFn: async () => {
                const response = await api.get(search ? 'users/search' : 'users', {
                    query: {
                        workspaceId,
                        query: search,
                        select: 'CreatedTime,Id,Email,Profile.DisplayName,Profile.Image',
                        order: '-CreatedTime',
                        size: 5
                    }
                });
                if (!response.ok) {
                    return null;
                }
                return await response.json<PaginatedList<LocalUser>>();
            },
            placeholderData: keepPreviousData
        }))
    );
    const updateSearch = debounce((value: string) => {
        search = value;
    }, 300);

    const addMutation = createMutation({
        mutationFn: ({ issueId, user }: { issueId: string; user: LocalUser }) =>
            api.post(`issue-assignees`, { body: { issueId, userId: user.id } }),
        onMutate: async ({ user }) => {
            await queryClient.cancelQueries({ queryKey: assigneeListQueryKey });
            const old =
                queryClient.getQueryData<PaginatedList<LocalIssueAssignee>>(assigneeListQueryKey);
            queryClient.setQueryData(
                assigneeListQueryKey,
                paginatedList({
                    items: [
                        ...(old?.items ?? []),
                        {
                            user: {
                                id: user.id,
                                email: user.email,
                                createdTime: user.createdTime,
                                profile: {
                                    displayName: user.profile?.displayName,
                                    image: imageFromAsset(cloudinary)(user.profile?.image)
                                        ?.resize(Resize.fill(64))
                                        .toURL()
                                }
                            }
                        }
                    ],
                    totalCount: (old?.totalCount ?? 0) + 1
                })
            );
            return { old };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || (data != null && !data.ok)) {
                if (context) {
                    queryClient.setQueryData(assigneeListQueryKey, context.old);
                }
            }
            await queryClient.invalidateQueries({ queryKey: assigneeListQueryKey });
        }
    });

    const deleteMutation = createMutation({
        mutationFn: ({ issueId, userId }: { issueId: string; userId: string }) =>
            api.delete(`issue-assignees/${issueId}/${userId}`),
        onMutate: async ({ userId }) => {
            await queryClient.cancelQueries({ queryKey: assigneeListQueryKey });
            const old =
                queryClient.getQueryData<PaginatedList<LocalIssueAssignee>>(assigneeListQueryKey);
            queryClient.setQueryData(
                assigneeListQueryKey,
                paginatedList({
                    items: old?.items.filter((a) => a.user.id !== userId) ?? [],
                    totalCount: (old?.totalCount ?? 0) - 1
                })
            );
            return { old };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || (data != null && !data.ok)) {
                if (context) {
                    queryClient.setQueryData(assigneeListQueryKey, context.old);
                }
            }
            await queryClient.invalidateQueries({ queryKey: assigneeListQueryKey });
        }
    });

    when(
        () => $searchQuery.isFetching,
        () => {
            status = 'pending';
        },
        '1 second'
    );
    when(
        () => !$searchQuery.isFetching,
        () => {
            status = null;
        }
    );
</script>

<div class:animate-pulse={$searchQuery.isFetching}>
    <Input
        type="text"
        size="sm"
        class="mb-2"
        placeholder="Type or select a user"
        oninput={(e) => {
            updateSearch(e.currentTarget.value);
        }}
    />
    {#if status === 'pending'}
        <Spinner2 class="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2" />
    {/if}
    {#if $searchQuery.isPending}
        <ul class="space-y-1">
            {#each { length: 3 } as _}
                <li class="c-select--option bg-base-3 h-7 w-full animate-pulse"></li>
            {/each}
        </ul>
    {:else if $searchQuery.error}
        <span class="c-text-secondary">Something went wrong while searching for users.</span>
    {:else if $searchQuery.data == null || $searchQuery.data.items.length === 0}
        <span class="c-text-secondary px-2">No users found.</span>
    {:else}
        <ul class="space-y-1">
            {#each $searchQuery.data.items as user (user.id)}
                <li class="c-select--option" {...selectBuilder.getOption(user.id)}>
                    <Avatar {user} size={64} class="w-6" />
                    {#if selectBuilder.isSelected(user.id)}
                        <IconCheck class="c-select--check" />
                    {/if}
                    {user.profile?.displayName ?? user.email}
                </li>
            {/each}
        </ul>
    {/if}
</div>
