<script lang="ts">
    import { Resize } from '@cloudinary/url-gen/actions';
    import { debounce } from '@mobily/ts-belt/Function';
    import { createMutation, createQuery } from '@tanstack/svelte-query';
    import { Combobox } from 'melt/builders';
    import { SvelteSet } from 'svelte/reactivity';
    import { toStore } from 'svelte/store';
    import { Avatar, Input } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { User } from '~/lib/models/user';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import SelectAssigneesOptions from './SelectAssigneesOptions.svelte';

    interface Props {
        workspaceId: string;
        issueId: string;
        canAssign: boolean;
    }

    type LocalUser = Pick<User, 'id' | 'email'> & {
        profile?: Pick<NonNullable<User['profile']>, 'displayName' | 'image'>;
    };

    const { workspaceId, issueId, canAssign }: Props = $props();
    const { api, queryClient, cloudinary } = useRuntime();
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
    const assignees = $derived(
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

    let value = new SvelteSet<string>($selectedQuery.data?.map((a) => a.id));
    const builder = new Combobox({
        multiple: true,
        forceVisible: true,
        sameWidth: false,
        floatingConfig: {
            computePosition: {
                placement: 'bottom',
            },
        },
        value: () => Array.from(value.values()),
        onValueChange: (next) => {
            for (const a of next.values()) {
                if (value.has(a)) {
                    continue;
                }
                value.add(a);
                const user = queryClient
                    .getQueryData<
                        PaginatedList<LocalUser>
                    >(['users', { tag: 'select-assignees', workspaceId, search }])
                    ?.items.find((b) => b.id === a);
                if (user) {
                    $addMutation.mutate({
                        issueId,
                        userId: user.id,
                        email: user.email,
                        image: user.profile
                            ? imageFromAsset(cloudinary)(user.profile.image)
                                  ?.resize(Resize.fill(64))
                                  .toURL()
                            : undefined
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
    const updateSearch = debounce((value: string) => {
        search = value;
    }, 300);
</script>

<div>
    <div class="mb-2 flex items-center gap-2">
        <h2 class="c-label">Assignees</h2>
        {#if value.size > 0}
            <span class="bg-base-3 text-base-fg-3 rounded-full px-2 text-sm font-medium">
                {value.size}
            </span>
        {/if}
    </div>
    {#if canAssign}
        <Input
            type="text"
            size="sm"
            class="mb-2"
            {...builder.input}
            oninput={(e) => {
                updateSearch(e.currentTarget.value);
                builder.input.oninput(e);
            }}
            onfocus={() => {
                builder.open = true;
            }}
        />
    {/if}
    {#if builder.open}
        <SelectAssigneesOptions {workspaceId} {builder} {search} />
    {/if}
    {#if assignees.length}
        <ul class="mb-3 space-y-2">
            {#each assignees as assignee (assignee.value)}
                <li class="flex items-center gap-2">
                    <Avatar
                        title={assignee.label}
                        seed={assignee.email}
                        src={assignee.image}
                        class="size-avatar-sm"
                    />
                    <div class="overflow-hidden text-ellipsis">
                        {assignee.label}
                    </div>
                </li>
            {/each}
        </ul>
    {/if}
</div>
