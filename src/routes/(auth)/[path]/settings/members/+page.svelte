<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import type { ActionData, PageData } from './$types';
    import { invalidate } from '$app/navigation';
    import {
        IconButton,
        Icon,
        Row,
        Table,
        Th,
        THead,
        Pagination,
        Button,
        Input
    } from '~/lib/components';
    import InviteMemberDialog from './InviteMemberDialog.svelte';
    import { toStore, writable } from 'svelte/store';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    const query = createQuery(
        toStore(() => ({
            queryKey: ['workspace-members', { workspaceId: data.workspace.id }],
            queryFn: async () => {
                await invalidate('fetch:workspace-members');
                return data.members;
            }
        }))
    );
    const showInviteMember = writable(false);
</script>

<InviteMemberDialog
    workspaceId={data.workspace.id}
    open={showInviteMember}
    form={form?.inviteMember}
/>

<main class="grid grid-rows-[auto_1fr] h-full overflow-auto divide-y divide-base-border-2">
    <div class="flex justify-between divide-x divide-base-border-2 first:*:pl-8 last:*:pr-8 *:px-2">
        <div class="relative grow">
            <Icon
                name="search"
                class="absolute left-8 top-1/2 -translate-y-1/2 text-base-fg-ghost"
            />
            <Input
                type="text"
                class="pl-8 border-none focus:shadow-none py-0 h-full"
                placeholder="Search member"
            />
        </div>
        <div class="!px-0 !py-0">
            <Button
                variant="base"
                size="sm"
                filled={false}
                class="rounded-none w-fit h-full flex items-center gap-2 pr-8 py-2"
                flat
                onclick={() => {
                    $showInviteMember = true;
                }}
            >
                <Icon name="plus" />
                Invite member
            </Button>
        </div>
    </div>
    <Table class="grid-cols-[1fr_1fr_auto]">
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
