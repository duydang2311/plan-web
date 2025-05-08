<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { Button, toast } from '~/lib/components';
    import { IconChevronUpDown } from '~/lib/components/icons';
    import Select from '~/lib/components/select';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { errorCodes } from '~/lib/models/errors';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import type { Role } from '~/lib/models/role';
    import { QueryResponse } from '~/lib/utils/query';
    import { attempt } from '~/lib/utils/try';

    const {
        workspaceMemberId,
        role,
        canUpdate
    }: { workspaceMemberId: number; role: Pick<Role, 'id' | 'name'>; canUpdate: boolean } =
        $props();
    let value = $state.raw(role.id);
    const builder = new Select.Builder({
        forceVisible: true,
        value: () => value + '',
        onValueChange: async (a) => {
            const n = Number(a);
            if (a == null || isNaN(n)) {
                return;
            }

            const old = value;
            value = n;

            const tryPatchRole = await attempt.promise(() =>
                api.patch(`workspace-members/${workspaceMemberId}`, {
                    body: { patch: { roleId: Number(a) } }
                })
            )(errorCodes.fromFetch);
            if (tryPatchRole.failed || !tryPatchRole.data.ok) {
                value = old;
                toast({
                    type: 'negative',
                    body: 'Something went wrong while updating member role.',
                    footer: `Error code: ${tryPatchRole.failed ? tryPatchRole.error : tryPatchRole.data.status}.`
                });
                return;
            }
            toast({
                type: 'positive',
                body: 'Member role updated successfully.'
            });
        }
    });
    const { api } = useRuntime();
    const query = createQuery({
        queryKey: ['workspace-roles'],
        queryFn: async () => {
            const response = await QueryResponse.HTTP(() =>
                api.get('roles', {
                    query: {
                        type: 'workspace',
                        select: 'Id,Rank,Name'
                    }
                })
            );
            const json = await QueryResponse.JSON(() =>
                response.json<PaginatedList<{ id: number; rank: number; name: string }>>()
            );
            return paginatedList({
                items: json.items.toSorted((a, b) => a.rank - b.rank),
                totalCount: json.totalCount
            });
        }
    });
    const roleName = $derived(
        $query.data == null
            ? role.name
            : ($query.data.items.find((a) => a.id === value)?.name ?? role.name)
    );
</script>

{#if !canUpdate}
    <span>{role.name}</span>
{:else}
    <Button
        {...builder.trigger}
        type="button"
        variant="base"
        class="flex w-max min-w-40 items-center justify-between gap-2 px-4 text-left font-normal"
    >
        <span>{roleName}</span>
        <IconChevronUpDown class="-mr-2" />
    </Button>
    {#if builder.open}
        <Select {...builder.content}>
            {#if $query.isPending}
                Loading roles...
            {:else if $query.error}
                Something went wrong while retrieving roles.
            {:else if $query.data.items.length === 0}
                No roles found.
            {:else}
                {#each $query.data.items as role (role.id)}
                    {@const id = role.id + ''}
                    <Select.Option {...builder.getOption(id)}>
                        {#if builder.isSelected(id)}
                            <Select.Check />
                        {/if}
                        <span>
                            {role.name}
                        </span>
                    </Select.Option>
                {/each}
            {/if}
        </Select>
    {/if}
{/if}
