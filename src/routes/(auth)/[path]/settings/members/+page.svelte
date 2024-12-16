<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore, writable } from 'svelte/store';
    import {
        Button,
        Icon,
        IconButton,
        Input,
        Pagination,
        Row,
        Table,
        Th,
        THead
    } from '~/lib/components';
    import type { ActionData, PageData } from './$types';
    import InviteMemberDialog from './InviteMemberDialog.svelte';
    import SelectView from './SelectView.svelte';

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
    <div class="flex divide-x divide-base-border-2">
        <SelectView
            options={[
                { label: 'Active members', value: 'active', icon: 'users-solid', default: true },
                { label: 'Pending members', value: 'pending', icon: 'user-plus' }
            ]}
        />
        <div class="relative grow">
            <Icon
                name="search"
                class="absolute left-2 top-1/2 -translate-y-1/2 text-base-fg-ghost"
            />
            <Input
                type="text"
                class="pl-8 border-none focus:shadow-none py-0 h-full"
                placeholder="Search member"
            />
        </div>
        <div>
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
