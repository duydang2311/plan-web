<script lang="ts">
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { InvitationListQuery, type LocalProjectMemberInvitation } from './utils';
    import { page } from '$app/state';
    import { QueryResponse } from '~/lib/utils/query';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { Avatar, OptionalLink, Row, Table, Th, THead, ThSort2 } from '~/lib/components';
    import { createSort, paginationHelper, sortHelper } from '~/lib/utils/table.svelte';
    import { browser } from '$app/environment';
    import { DateTime } from 'luxon';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import Pagination2 from '~/lib/components/Pagination2.svelte';
    import { Resize } from '@cloudinary/url-gen/actions';
    import DeleteInvitationAction from './DeleteInvitationAction.svelte';

    const { projectId }: { projectId: string } = $props();
    const { cloudinary, api } = useRuntime();

    const sort = createSort({
        fields: page.url.searchParams.get('order') ?? undefined,
        onDirectionChange: browser ? sortHelper.replaceState(page.url) : undefined
    });
    const pagination = paginationHelper.createPagination(page.url);
    const queryParams = $derived(
        InvitationListQuery.params({
            url: page.url,
            projectId,
            order: sort.string,
            page: pagination.page,
            size: pagination.rowsPerPage
        })
    );
    const queryKey = $derived(InvitationListQuery.key({ params: queryParams }));
    const query = createQuery(
        toStore(() => {
            return {
                queryKey,
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get('project-member-invitations', { query: queryParams })
                    );
                    return QueryResponse.JSON(() =>
                        response.json<PaginatedList<LocalProjectMemberInvitation>>()
                    );
                },
                placeholderData: keepPreviousData
            };
        })
    );
    pagination.sync(() => $query.data);
</script>

{#snippet skeleton()}
    <Row>
        <td class="text-base-fg-ghost">
            <div class="w-32 h-4 bg-base-3 animate-pulse"></div>
        </td>
        <td class="text-base-fg-ghost">
            <div class="w-20 h-4 bg-base-3 animate-pulse"></div>
        </td>
        <td class="text-base-fg-ghost">
            <div class="w-20 h-4 bg-base-3 animate-pulse"></div>
        </td>
        <td class="text-base-fg-ghost">
            <div class="w-20 h-4 bg-base-3 animate-pulse"></div>
        </td>
    </Row>
{/snippet}

<div class="h-full grid grid-rows-[1fr_auto]">
    <Table class={['grid-cols-[1fr_auto_auto_auto]', $query.isFetching && 'animate-pulse']}>
        <THead>
            <Row class="py-1">
                <Th>User</Th>
                <ThSort2 field={sort.field('createdTime')}>Invited</ThSort2>
                <Th class="col-span-2">Role</Th>
            </Row>
        </THead>
        <tbody>
            {#if $query.isPending}
                {#each { length: 3 } as _}
                    {@render skeleton()}
                {/each}
            {:else if $query.data == null || $query.data.items.length === 0}
                <Row>
                    <td class="col-span-full text-sm text-base-fg-ghost">No entries found.</td>
                </Row>
            {:else}
                {#each $query.data.items as item (item.id)}
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
                                                ?.resize(Resize.crop(32))
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
                                {queryKey}
                                id={item.id}
                                name={item.user.profile?.displayName ?? item.user.email}
                            />
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    <Pagination2 {pagination} />
</div>
