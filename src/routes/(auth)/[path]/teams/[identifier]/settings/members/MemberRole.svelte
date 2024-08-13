<script lang="ts">
    import { page } from '$app/stores';
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { createMutation, useQueryClient } from '@tanstack/svelte-query';
    import clsx from 'clsx';
    import { circInOut } from 'svelte/easing';
    import { writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { Spinner } from '~/lib/components';
    import Button from '~/lib/components/Button.svelte';
    import Icon from '~/lib/components/Icon.svelte';
    import Select, { createSelectProps } from '~/lib/components/Select.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { TeamMember } from '~/lib/models/team';
    import { watch } from '~/lib/models/watchable';

    interface Props {
        data: TeamMember;
    }

    let { data }: Props = $props();
    let status = $state<'pending-long' | null>(null);
    const { httpClient } = useRuntime();
    const queryKey = $derived(['team-members', { teamId: $page.data['team'].id }]);
    const queryClient = useQueryClient();
    const roles = ['Administrator', 'Manager', 'Member', 'Guest'].map((a) => ({
        label: a,
        value: a
    }));
    const mutation = createMutation({
        mutationFn: (role: string) =>
            httpClient.put(`/api/teams/${data.teamId}/members/${data.member.id}/role`, {
                body: {
                    roleName: role
                }
            }),
        onMutate: async (role) => {
            await queryClient.cancelQueries({ queryKey });
            const oldMembers = queryClient.getQueryData<PaginatedList<TeamMember>>(queryKey);
            queryClient.setQueryData<PaginatedList<TeamMember>>(queryKey, (old) =>
                old
                    ? {
                          ...old,
                          items: old.items.map((a) =>
                              a.role.id === data.roleId
                                  ? { ...a, role: { ...a.role, name: role } }
                                  : a
                          )
                      }
                    : undefined
            );
            return { oldMembers };
        },
        onSettled: async (data, error, _variables, context) => {
            if (error || !data?.ok) {
                if (context) {
                    queryClient.setQueryData(queryKey, context.oldMembers);
                    return;
                }
            }
            await queryClient.invalidateQueries({
                queryKey
            });
        }
    });
    let open = $state(false);
    let selected = writable<SelectOption<string>>(roles.find((x) => x.value === data.role.name));

    $effect(() => {
        if ($mutation.isPending) {
            return;
        }
        $selected = roles.find((x) => x.value === data.role.name)!;
    });
</script>

<Select
    options={createSelectProps<string, false>({
        forceVisible: true,
        positioning: { placement: 'bottom', fitViewport: true, sameWidth: true },
        selected,
        onSelectedChange: ({ curr, next }) => {
            if (curr && next && curr.value !== next.value) {
                watch($mutation.mutateAsync(next.value))
                    .after('1 second', () => {
                        status = 'pending-long';
                    })
                    .finally(() => {
                        status = null;
                    });
            }
            return next;
        }
    })}
    bind:open
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            type="button"
            variant="base"
            outline
            melt={trigger}
            class="relative text-left w-full max-w-48"
        >
            {$selected.label}
            {#if status === 'pending-long'}
                <div
                    transition:fade={{ duration: 200, easing: circInOut }}
                    class="absolute right-0 -translate-x-1/2 top-1/2 -translate-y-1/2"
                >
                    <Spinner />
                </div>
            {/if}
        </Button>
        {#if open}
            <ol
                use:melt={menu}
                class="p-1 bg-base-1 border border-base-border rounded shadow-sm space-y-1"
            >
                {#each roles as role (role.value)}
                    {@const opt = option(role)}
                    {@const selected = isSelected(role.value)}
                    <li
                        use:melt={opt}
                        class={clsx(
                            'relative pl-10 py-2 cursor-default rounded-md w-full',
                            selected
                                ? 'bg-base-2 text-base-fg-1 font-medium'
                                : 'text-base-fg-3 hover:text-base-fg-1 hover:bg-base-2 data-[highlighted]:bg-base-2 data-[highlighted]:text-base-fg-1'
                        )}
                    >
                        {#if selected}
                            <Icon
                                name="check"
                                class="absolute left-0 translate-x-1/2 top-1/2 -translate-y-1/2 text-primary-1"
                            />
                        {/if}
                        {role.label}
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</Select>
