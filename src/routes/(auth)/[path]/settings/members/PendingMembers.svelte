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
    import DeleteInvitationButton from './DeleteInvitationButton.svelte';

    const { data, canDelete }: { data: PageData; canDelete: boolean } = $props();
    const listRef = createRef.maybePromise(() => data.invitationList);
    const { cloudinary } = useRuntime();
    const pagination = createPagination({
        syncList: () => listRef.value ?? paginatedList(),
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
                {#if listRef.isInitialLoading}
                    <Row>
                        <td class="text-base-fg-ghost col-span-full">Loading...</td>
                    </Row>
                {:else if listRef.value == null || listRef.value.items.length === 0}
                    <Row>
                        <td class="text-base-fg-ghost col-span-full">No invitations found.</td>
                    </Row>
                {:else}
                    {#each listRef.value.items as { id, user, createdTime } (id)}
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
                            <td
                                class="overflow-hidden text-ellipsis whitespace-nowrap"
                                title={DateTime.fromISO(createdTime).toRelative()}
                            >
                                {DateTime.fromISO(createdTime).toRelative()}
                            </td>
                            {#if canDelete}
                                <td class="flex items-center justify-end">
                                    <DeleteInvitationButton {id} />
                                </td>
                            {/if}
                        </Row>
                    {/each}
                {/if}
            </tbody>
        </Table>
    </div>
    {#if listRef.value != null && listRef.value.items.length > 0}
        <Pagination3 {pagination} class="mt-2">
            {#snippet label({ from, to, totalCount })}
                Showing <strong>{from}</strong> - <strong>{to}</strong> of
                <strong>{totalCount}</strong> invitations.
            {/snippet}
        </Pagination3>
    {/if}
</div>
