<script lang="ts">
    import { page } from '$app/state';
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { createMutation, useQueryClient } from '@tanstack/svelte-query';
    import clsx from 'clsx';
    import { circInOut } from 'svelte/easing';
    import { writable } from 'svelte/store';
    import { fade } from 'svelte/transition';
    import { Button, SelectBuilder, Spinner } from '~/lib/components';
    import { IconCheck } from '~/lib/components/icons';
    import { createSelectProps } from '~/lib/components/SelectBuilder.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { TeamMember } from '~/lib/models/team';
    import { watch } from '~/lib/models/watchable';

    interface Props {
        data: TeamMember;
    }

    let { data }: Props = $props();
    let status = $state<'pending-long' | null>(null);
    const { api } = useRuntime();
    const queryKey = $derived(['team-members', { teamId: page.data['team'].id }]);
    const queryClient = useQueryClient();
    const roles = ['Administrator', 'Manager', 'Member', 'Guest'].map((a) => ({
        label: a,
        value: a
    }));
    const mutation = createMutation({
        mutationFn: (role: string) =>
            api.put(`teams/${data.teamId}/members/${data.member.id}`, {
                body: { roleName: role }
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
            // TODO: handle error
            if (error || !data?.ok) {
                if (context) {
                    queryClient.setQueryData(queryKey, context.oldMembers);
                }
            }
            await queryClient.invalidateQueries({
                queryKey
            });
        }
    });
    const open = writable(false);
    const selected = writable<SelectOption<string>>(roles.find((x) => x.value === data.role.name));

    $effect(() => {
        if ($mutation.isPending) {
            return;
        }
        $selected = roles.find((x) => x.value === data.role.name)!;
    });
</script>

<SelectBuilder
    options={createSelectProps<string, false>({
        open,
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
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            type="button"
            variant="base"
            outline
            melt={trigger}
            class="relative w-full max-w-48 text-left"
        >
            {$selected.label}
            {#if status === 'pending-long'}
                <div
                    transition:fade={{ duration: 200, easing: circInOut }}
                    class="absolute right-0 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                    <Spinner />
                </div>
            {/if}
        </Button>
        {#if open}
            <ol
                use:melt={menu}
                class="bg-base-1 border-base-border-2 space-y-1 rounded border p-1 shadow-sm"
            >
                {#each roles as role (role.value)}
                    {@const opt = option(role)}
                    {@const selected = isSelected(role.value)}
                    <li
                        use:melt={opt}
                        class={clsx(
                            'relative w-full cursor-default rounded-md py-2 pl-10',
                            selected
                                ? 'bg-base-2 text-base-fg-1 font-medium'
                                : 'text-base-fg-3 hover:text-base-fg-1 hover:bg-base-2 data-[highlighted]:bg-base-2 data-[highlighted]:text-base-fg-1'
                        )}
                    >
                        {#if selected}
                            <IconCheck
                                class="text-primary-1 absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2"
                            />
                        {/if}
                        {role.label}
                    </li>
                {/each}
            </ol>
        {/if}
    {/snippet}
</SelectBuilder>
