<script lang="ts">
    import { page } from '$app/state';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { DateTime } from 'luxon';
    import { Avatar, Pagination3, Row, Table, Th, THead, ThSort3 } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList } from '~/lib/models/paginatedList';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { createPagination } from '~/lib/utils/table.svelte';
    import type { PageData } from './$types';
    import DeleteMemberButton from './DeleteMemberButton.svelte';
    import MemberRole from './MemberRole.svelte';
    import { permissions } from '~/lib/models/permission';

    const { data, canDelete }: { data: PageData; canDelete: boolean } = $props();
    const { cloudinary } = useRuntime();
    const memberListRef = createRef.maybePromise(() => data.memberList);
    const pagination = createPagination({
        syncList: () => memberListRef.value ?? paginatedList(),
        syncUrl: () => page.url
    });
    const workspacePermissionsRef = createRef.maybePromise(() => data.workspacePermissions);
    const can = $derived({
        update: workspacePermissionsRef.value?.has(permissions.updateWorkspaceMember) ?? false
    });
</script>

<div class="grid h-full grid-rows-[1fr_auto] gap-2">
    <div class="c-table--wrapper custom-scrollbar relative overflow-auto">
        <Table class="w-full grid-cols-[auto_1fr_1fr_auto_auto_auto]">
            <THead>
                <Row class="items-center py-2">
                    <Th class="col-span-2 capitalize">User</Th>
                    <Th class="capitalize">Role</Th>
                    <ThSort3 name="createdTime" class="capitalize">Joined</ThSort3>
                    {#if canDelete}
                        <Th>Actions</Th>
                    {/if}
                </Row>
            </THead>
            <tbody>
                {#if memberListRef.isInitialLoading}
                    <Row>
                        <td class="col-span-full">Loading...</td>
                    </Row>
                {:else if memberListRef.value == null || memberListRef.value.items.length === 0}
                    <Row>
                        <td class="col-span-full">No members found.</td>
                    </Row>
                {:else}
                    {#each memberListRef.value.items as { id, user, role, createdTime } (id)}
                        <Row>
                            <td class="ellipsis">
                                <Avatar
                                    seed={user.profile?.name ?? user.email}
                                    src={imageFromAsset(cloudinary)(user.profile?.image)
                                        ?.resize(Resize.fill(64))
                                        .toURL()}
                                    class="size-avatar-md"
                                />
                            </td>
                            <td class="overflow-hidden" title={user.email}>
                                {#if user.profile}
                                    <p class="ellipsis">
                                        {user.profile.displayName}
                                    </p>
                                {/if}
                                <p class="c-label ellipsis mt-0">
                                    {user.email}
                                </p>
                            </td>
                            <td class="ellipsis">
                                <MemberRole workspaceMemberId={id} {role} canUpdate={can.update} />
                            </td>
                            <td class="ellipsis" title={DateTime.fromISO(createdTime).toRelative()}>
                                {DateTime.fromISO(createdTime).toRelative()}
                            </td>
                            {#if canDelete}
                                <td class="flex items-center justify-end">
                                    <DeleteMemberButton {id} {memberListRef} />
                                </td>
                            {/if}
                        </Row>
                    {/each}
                {/if}
            </tbody>
        </Table>
    </div>
    {#if memberListRef.value != null && memberListRef.value.items.length > 0}
        <Pagination3 {pagination} class="mt-2">
            {#snippet label({ from, to, totalCount })}
                Showing <strong>{from}</strong> - <strong>{to}</strong> of
                <strong>{totalCount}</strong> members.
            {/snippet}
        </Pagination3>
    {/if}
</div>
