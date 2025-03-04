<script lang="ts">
    import { page } from '$app/state';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { DateTime } from 'luxon';
    import {
        Avatar,
        OptionalLink,
        Pagination3,
        Row,
        Table,
        Th,
        THead,
        ThSort3
    } from '~/lib/components';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import { type Loading, type Ref } from '~/lib/utils/runes.svelte';
    import { createPagination } from '~/lib/utils/table.svelte';
    import DeleteInvitationAction from './DeleteInvitationAction.svelte';
    import { type LocalProjectMemberInvitation } from './utils';

    const {
        ref,
        loading
    }: { ref: Ref<PaginatedList<LocalProjectMemberInvitation>>; loading: Loading } = $props();
    const { cloudinary } = useRuntime();
    const pagination = createPagination({
        syncUrl: () => page.url,
        syncList: () => ref.value ?? paginatedList()
    });
</script>

{#snippet skeleton()}
    <Row>
        <td class="text-base-fg-ghost">
            <div class="bg-base-3 h-4 w-32 animate-pulse"></div>
        </td>
        <td class="text-base-fg-ghost">
            <div class="bg-base-3 h-4 w-20 animate-pulse"></div>
        </td>
        <td class="text-base-fg-ghost">
            <div class="bg-base-3 h-4 w-20 animate-pulse"></div>
        </td>
        <td class="text-base-fg-ghost">
            <div class="bg-base-3 h-4 w-20 animate-pulse"></div>
        </td>
    </Row>
{/snippet}

<div class="grid h-full grid-rows-[1fr_auto]">
    <Table class={['grid-cols-[1fr_auto_auto_auto]', loading.immediate && 'animate-pulse']}>
        <THead>
            <Row class="py-2">
                <Th>User</Th>
                <ThSort3 name="createdTime">Invited date</ThSort3>
                <Th class="col-span-2">Role</Th>
            </Row>
        </THead>
        <tbody>
            {#if ref.value == null && loading.immediate}
                {#each { length: 3 } as _}
                    {@render skeleton()}
                {/each}
            {:else if ref.value == null || ref.value.items.length === 0}
                <Row>
                    <td class="text-base-fg-ghost col-span-full text-sm">No entries found.</td>
                </Row>
            {:else}
                {#each ref.value.items as item (item.id)}
                    {@const createdTime = DateTime.fromISO(item.createdTime)}
                    <Row>
                        <td>
                            <OptionalLink
                                href={item.user.profile
                                    ? `/profiles/${item.user.profile.name}`
                                    : undefined}
                                class="block w-fit"
                            >
                                {#if item.user.profile == null}
                                    {item.user.email}
                                {:else}
                                    <div class="flex items-center gap-2">
                                        <Avatar
                                            seed={item.user.profile.name}
                                            alt={item.user.profile.displayName}
                                            src={imageFromAsset(cloudinary)(item.user.profile.image)
                                                ?.resize(Resize.fill(64))
                                                .toURL()}
                                            class="size-8"
                                        />
                                        <span>
                                            {item.user.profile.displayName}
                                        </span>
                                    </div>
                                {/if}
                            </OptionalLink>
                        </td>
                        <td title={createdTime.toLocaleString(DateTime.DATETIME_MED)}>
                            {createdTime.toRelative()}
                        </td>
                        <td>
                            {item.role.name}
                        </td>
                        <td>
                            <DeleteInvitationAction
                                id={item.id}
                                name={item.user.profile?.displayName ?? item.user.email}
                                {ref}
                            />
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    <Pagination3 {pagination} />
</div>
