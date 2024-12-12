<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { type SelectOption } from '@melt-ui/svelte';
    import { createMutation, createQuery } from '@tanstack/svelte-query';
    import { toStore, writable } from 'svelte/store';
    import { Avatar, Button, Icon, Select } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { User } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import SelectAssigneesOptions from './SelectAssigneesOptions.svelte';

    interface Props {
        workspaceId: string;
        issueId: string;
    }

    type LocalUser = Pick<User, 'id' | 'email'> & {
        profile?: Pick<NonNullable<User['profile']>, 'displayName' | 'image'>;
    };

    const { workspaceId, issueId }: Props = $props();
    const { api, queryClient, cloudinary } = useRuntime();
    const open = writable(false);
    const selectedQueryKey = $derived(['issues', { issueId, tag: 'select-assignees' }]);
    const selectedQuery = createQuery(
        toStore(() => ({
            queryKey: selectedQueryKey,
            queryFn: async () => {
                const response = await api.get(`issues/${issueId}`, {
                    query: {
                        select: 'Assignees.Id,Assignees.Email,Assignees.Profile.DisplayName,Assignees.Profile.Image'
                    }
                });
                if (!response.ok) {
                    return null;
                }
                return await response.json<{ assignees: LocalUser[] }>().then((a) => a.assignees);
            }
        }))
    );
    const selected = writable<(SelectOption<string> & { email: string; image?: string })[]>(
        $selectedQuery.data?.map((a) => ({
            label: a.profile?.displayName ?? a.email,
            value: a.id,
            email: a.email,
            image: a.profile
                ? imageFromAsset(cloudinary)(a.profile?.image)?.resize(Resize.fill(64)).toURL()
                : undefined
        })) ?? []
    );
    const addMutation = createMutation({
        mutationFn: ({
            issueId,
            userId
        }: {
            issueId: string;
            userId: string;
            email: string;
            image?: string;
        }) => api.post(`issue-assignees`, { body: { issueId, userId } }),
        onMutate: async (variables) => {
            await queryClient.cancelQueries({ queryKey: selectedQueryKey });
            const old = queryClient.getQueryData<LocalUser[]>(selectedQueryKey);
            queryClient.setQueryData(selectedQueryKey, [...(old ?? []), variables]);
            return { old };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || (data != null && !data.ok)) {
                if (context) {
                    queryClient.setQueryData(selectedQueryKey, context.old);
                }
            }
            await queryClient.invalidateQueries({ queryKey: selectedQueryKey });
        }
    });
    const deleteMutation = createMutation({
        mutationFn: ({ issueId, userId }: { issueId: string; userId: string }) =>
            api.delete(`issue-assignees/${issueId}/${userId}`),
        onMutate: async ({ userId }) => {
            await queryClient.cancelQueries({ queryKey: selectedQueryKey });
            const old = queryClient.getQueryData<LocalUser[]>(selectedQueryKey);
            queryClient.setQueryData(
                selectedQueryKey,
                old?.filter((a) => a.id !== userId)
            );
            return { old };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || (data != null && !data.ok)) {
                if (context) {
                    queryClient.setQueryData(selectedQueryKey, context.old);
                }
            }
            await queryClient.invalidateQueries({ queryKey: selectedQueryKey });
        }
    });

    createEffect(
        () => {
            if ($selectedQuery.data) {
                $selected = $selectedQuery.data.map((a) => ({
                    label: a.profile?.displayName ?? a.email,
                    value: a.id,
                    email: a.email,
                    imageHref: a.profile
                        ? imageFromAsset(cloudinary)(a.profile?.image)?.resize(Resize.fill(32))
                        : null
                }));
            }
        },
        () => $selectedQuery
    );
</script>

<div>
    <div class="flex items-center gap-2 mb-2">
        <h2 class="c-label">Assignees</h2>
        {#if $selected.length > 0}
            <span class="text-sm font-medium px-2 rounded-full bg-base-3 text-base-fg-3">
                {$selected.length}
            </span>
        {/if}
    </div>
    {#if $selected.length}
        <ul class="space-y-2 mb-3">
            {#each $selected as option (option.value)}
                <li class="flex gap-2 items-center">
                    <Avatar
                        title={option.label}
                        seed={option.email}
                        src={option.image}
                        class="w-8"
                    />
                    <div class="text-ellipsis overflow-hidden">
                        {option.label}
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
    <Select
        options={{
            multiple: true,
            forceVisible: true,
            selected,
            open,
            positioning: {
                sameWidth: false,
                placement: 'left-start'
            },
            onSelectedChange: ({ curr, next }) => {
                const added =
                    curr == null
                        ? next
                        : next?.filter((a) => curr.every((b) => b.value !== a.value));
                const removed =
                    next == null
                        ? curr
                        : curr?.filter((a) => next.every((b) => b.value !== a.value));
                if (added) {
                    for (const a of added) {
                        $addMutation.mutate({
                            issueId,
                            userId: a.value,
                            email: a.email,
                            image: a.image
                        });
                    }
                }
                if (removed) {
                    for (const a of removed) {
                        $deleteMutation.mutate({
                            issueId,
                            userId: a.value
                        });
                    }
                }
                return curr;
            }
        }}
    >
        {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
            <Button
                type="button"
                variant="base"
                size="sm"
                melt={trigger}
                class="flex items-center gap-2"
            >
                <Icon name="plus" />
                Add assignee
            </Button>
            {#if $open}
                <SelectAssigneesOptions
                    {workspaceId}
                    builders={{ menu, option }}
                    helpers={{ isSelected }}
                />
            {/if}
        {/snippet}
    </Select>
</div>
