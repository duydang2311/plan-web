<script lang="ts">
    import { invalidateAll } from '$app/navigation';
    import { pipe } from '@baetheus/fun/fn';
    import { melt, type SelectOption } from '@melt-ui/svelte';
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore, writable } from 'svelte/store';
    import { Button, SelectBuilder, toast } from '~/lib/components';
    import { IconCheck, IconChevronUpDown } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { HttpError } from '~/lib/models/errors';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { TE } from '~/lib/utils/functional';
    import { QueryResponse } from '~/lib/utils/query';
    import { select, tsap } from '~/lib/utils/transition';

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
                return paginatedList({
                    items: list.items.map((a) => ({
                        ...a,
                        value: a.id,
                        label: a.name
                    })),
                    totalCount: list.totalCount
                });
            }
        }))
    );
    const selected = writable<SelectOption<number>>({
        value: defaultRole.id,
        label: defaultRole.name
    });
    const open = writable(false);

    const patchRole = async (roleId: number) => {
        const old = $selected;
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
            $selected = old;
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

<SelectBuilder
    options={{
        selected,
        open,
        forceVisible: true,
        onSelectedChange: ({ next }) => {
            if (next) {
                patchRole(next.value);
            }
            return next;
        }
    }}
>
    {#snippet children({ trigger, menu, option, helpers: { isSelected } })}
        <Button
            variant="base"
            size="sm"
            melt={trigger}
            class="flex w-40 min-w-fit items-center justify-between gap-2"
        >
            {$selected.label}
            <IconChevronUpDown class="size-4" />
        </Button>
        {#if $open}
            <div class="c-select--menu" use:melt={menu} in:tsap={select.in} out:tsap={select.out}>
                {#if $query.isLoading}
                    {@render skeleton()}
                {:else if $query.data == null || $query.data.items.length === 0}
                    Empty
                {:else}
                    <ol>
                        {#each $query.data.items as role (role.id)}
                            {@const opt = option(role)}
                            <li class="c-select--option" use:melt={opt}>
                                {#if isSelected(role.value)}
                                    <IconCheck class="c-select--check" />
                                {/if}
                                {role.label}
                            </li>
                        {/each}
                    </ol>
                {/if}
            </div>
            <ol></ol>
        {/if}
    {/snippet}
</SelectBuilder>
