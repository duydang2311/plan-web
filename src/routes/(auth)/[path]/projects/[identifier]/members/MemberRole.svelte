<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { pipe } from '@baetheus/fun/fn';
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { Button, toast } from '~/lib/components';
    import { IconCheck, IconChevronUpDown } from '~/lib/components/icons';
    import Select from '~/lib/components/select';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { HttpError } from '~/lib/models/errors';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { TE } from '~/lib/utils/functional';
    import { QueryResponse } from '~/lib/utils/query';

    interface LocalRole {
        id: number;
        name: string;
    }

    const {
        projectMemberId,
        defaultRole
    }: { projectMemberId: number; defaultRole: { id: number; name: string } } = $props();
    const { api } = useRuntime();
    const query = createQuery(
        toStore(() => ({
            queryKey: ['roles', { type: 'project' }],
            queryFn: async () => {
                const response = await QueryResponse.HTTP(() =>
                    api.get('roles', { query: { type: 'project', select: 'Id,Name' } })
                );
                const list = await QueryResponse.JSON(() =>
                    response.json<PaginatedList<LocalRole>>()
                );
                return list;
            }
        }))
    );
    let value = $state.raw(defaultRole.id.toString());
    const select = new Select.Builder({
        forceVisible: true,
        value: () => value,
        onValueChange: (a) => {
            if (a) {
                patchRole(Number(a));
                value = a;
            }
        }
    });
    const selected = $derived(
        $query.data?.items.find((a) => a.id === Number(value)) ?? defaultRole
    );

    const patchRole = async (roleId: number) => {
        const old = value;
        const patch = await pipe(
            TE.fromPromise(
                () =>
                    api.patch(`project-members/${projectMemberId}`, {
                        body: {
                            patch: {
                                roleId
                            }
                        }
                    }),
                () => 'fetch'
            )(),
            TE.flatMap((a) => (a.ok ? TE.right(a) : TE.left(HttpError.from(a))))
        )();
        if (patch.tag === 'Left') {
            value = old;
            if (typeof patch.left === 'string') {
                toast({
                    type: 'negative',
                    body: `Failed to update the role due to network error. Please check your connection and try again.`
                });
            } else {
                toast({
                    type: 'negative',
                    body: `The server responded with an error while trying to update the role (status code: ${patch.left.status}). Please try again later.`
                });
            }
        } else {
            toast({
                type: 'positive',
                body: `Role updated successfully.`
            });
        }
        await invalidateAll();
    };
</script>

{#snippet skeleton()}
    <div class="animate-pulse space-y-2">
        {#each { length: 4 } as _}
            <div class="bg-base-3 h-6 w-full rounded"></div>
        {/each}
    </div>
{/snippet}

<Button
    {...select.trigger}
    variant="base"
    size="sm"
    filled={false}
    class="flex w-40 min-w-fit items-center justify-between gap-2"
>
    {selected.name}
    <IconChevronUpDown class="size-4" />
</Button>
{#if select.open}
    <Select {...select.content}>
        {#if $query.isPending}
            {@render skeleton()}
        {:else if $query.data == null || $query.data.items.length === 0}
            <span class="c-text-secondary"> No roles found. </span>
        {:else}
            <ol>
                {#each $query.data.items as role (role.id)}
                    {@const id = role.id + ''}
                    <li>
                        <Select.Option {...select.getOption(id)}>
                            {#if select.isSelected(id)}
                                <Select.Check />
                            {/if}
                            {role.name}
                        </Select.Option>
                    </li>
                {/each}
            </ol>
        {/if}
    </Select>
{/if}
