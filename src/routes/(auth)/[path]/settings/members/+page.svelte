<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import type { PageData } from './$types';
    import { invalidate } from '$app/navigation';
    import { IconButton, Icon, Row, Table, Th, THead, Pagination } from '~/lib/components';

    const { data }: { data: PageData } = $props();
    const query = createQuery({
        queryKey: ['workspace-members'],
        queryFn: async () => {
            await invalidate('fetch:workspace-members');
            return data.members;
        }
    });
</script>

<main class="h-full flex flex-col justify-between overflow-auto">
    <Table style="grid-template-columns: 1fr 1fr auto;">
        <THead>
            <Row class="py-2">
                <Th>Email address</Th>
                <Th>Role</Th>
                <Th>Actions</Th>
            </Row>
        </THead>
        <tbody>
            {#if !$query.data}
                <Row>
                    <td style="grid-column: 1 / -1;">No members yet.</td>
                </Row>
            {:else}
                {#each $query.data.items as { userId, user, role } (userId)}
                    <Row>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={user.email}>{user.email}</td
                        >
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={role.name}
                        >
                            {role.name}
                        </td>
                        <td>
                            <div class="flex flex-wrap gap-2">
                                <IconButton
                                    type="button"
                                    variant="negative"
                                    title="Remove member"
                                    class="w-fit"
                                >
                                    <Icon name="trash" />
                                </IconButton>
                            </div>
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    {#if $query.data}
        <Pagination query={data.query} list={$query.data}>
            {#snippet label({ from, to, totalCount })}
                Displaying {from} - {to} out of {totalCount} members.
            {/snippet}
        </Pagination>
    {/if}
</main>
