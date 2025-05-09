<script lang="ts">
    import { page } from '$app/state';
    import { Resize } from '@cloudinary/url-gen/actions';
    import {
        Avatar,
        Pagination3,
        RelativeTime,
        Row,
        Table,
        Th,
        THead,
        ThSort3
    } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { type AsyncRef } from '~/lib/utils/runes.svelte';
    import { createPagination } from '~/lib/utils/table.svelte';
    import type { LocalWorkspaceInvitation } from './+page.server';
    import DeleteInvitationButton from './DeleteInvitationButton.svelte';

    const {
        invitationListRef,
        canDelete
    }: {
        invitationListRef: AsyncRef<PaginatedList<LocalWorkspaceInvitation>>;
        canDelete: boolean;
    } = $props();
    const { cloudinary } = useRuntime();
    const pagination = createPagination({
        syncList: () => invitationListRef.value ?? paginatedList(),
        syncUrl: () => page.url
    });
</script>

<div class="grid h-full grid-rows-[1fr_auto]">
    <div class="c-table--wrapper custom-scrollbar relative overflow-auto">
        <Table class="grid-cols-[auto_1fr_auto_auto]">
            <THead>
                <Row class="items-center py-2">
                    <Th class="col-span-2">User</Th>
                    <ThSort3 name="createdTime">Sent</ThSort3>
                    {#if canDelete}
                        <Th>Actions</Th>
                    {/if}
                </Row>
            </THead>
            <tbody>
                {#if invitationListRef.isInitialLoading}
                    <Row>
                        <td class="text-base-fg-ghost col-span-full">Loading...</td>
                    </Row>
                {:else if invitationListRef.value == null || invitationListRef.value.items.length === 0}
                    <Row>
                        <td class="text-base-fg-ghost col-span-full">No invitations found.</td>
                    </Row>
                {:else}
                    {#each invitationListRef.value.items as { id, optimisticId, user, createdTime } (id ?? optimisticId)}
                        <Row>
                            <td class="overflow-hidden text-ellipsis whitespace-nowrap">
                                <Avatar
                                    seed={user.profile?.name ?? user.email}
                                    src={imageFromAsset(cloudinary)(user.profile?.image)
                                        ?.resize(Resize.fill(64))
                                        .toURL()}
                                    class="size-avatar-md"
                                />
                            </td>
                            <td
                                class="overflow-hidden text-ellipsis whitespace-nowrap"
                                title={user.email}
                            >
                                {#if user.profile}
                                    <p>
                                        {user.profile.displayName}
                                    </p>
                                {/if}
                                <p class="c-label">
                                    {user.email}
                                </p>
                            </td>
                            <td class="overflow-hidden text-ellipsis whitespace-nowrap">
                                <RelativeTime time={createdTime} />
                            </td>
                            {#if id && canDelete}
                                <td class="flex items-center justify-end">
                                    <DeleteInvitationButton {id} {invitationListRef} />
                                </td>
                            {/if}
                        </Row>
                    {/each}
                {/if}
            </tbody>
        </Table>
    </div>
    {#if invitationListRef.value != null && invitationListRef.value.items.length > 0}
        <Pagination3 {pagination} class="mt-2">
            {#snippet label({ from, to, totalCount })}
                Showing <strong>{from}</strong> - <strong>{to}</strong> of
                <strong>{totalCount}</strong> invitations.
            {/snippet}
        </Pagination3>
    {/if}
</div>
