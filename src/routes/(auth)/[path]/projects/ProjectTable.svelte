<script lang="ts">
    import { page } from '$app/state';
    import { RelativeTime, Row, Table, Th, THead, ThSort3 } from '~/lib/components';
    import Pagination3 from '~/lib/components/Pagination3.svelte';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { createRef, type Loading } from '~/lib/utils/runes.svelte';
    import { createPagination } from '~/lib/utils/table.svelte';
    import type { LocalProject } from './+page.server';
    import DeleteButton from './DeleteButton.svelte';

    const {
        projectList,
        loading,
        canDeleteProject
    }: {
        projectList: PaginatedList<LocalProject> | undefined;
        loading: Loading;
        canDeleteProject: boolean;
    } = $props();
    const pagination = createPagination({
        syncUrl: () => page.url,
        syncList: () => projectList ?? paginatedList()
    });
    const ref = createRef(() => projectList);
</script>

{#snippet skeleton()}
    <Row class="animate-pulse">
        <td>
            <div class="bg-base-3 h-6 w-16"></div>
        </td>
        <td>
            <div class="bg-base-3 h-6 w-32"></div>
        </td>
        <td>
            <div class="bg-base-3 h-6 w-24"></div>
        </td>
        <td>
            <div class="bg-base-3 h-6 w-24"></div>
        </td>
        <td>
            <div class="bg-base-3 h-6 w-8"></div>
        </td>
    </Row>
{/snippet}

<Table class={['grid-cols-[auto_1fr_auto_auto_auto]', loading.immediate && 'animate-pulse']}>
    <THead>
        <Row class="py-2">
            <ThSort3 name="identifier">Identifier</ThSort3>
            <ThSort3 name="name">Name</ThSort3>
            <ThSort3 name="createdTime">Created</ThSort3>
            <ThSort3 name="updatedTime">Updated</ThSort3>
            {#if canDeleteProject}
                <Th></Th>
            {/if}
        </Row>
    </THead>
    <tbody>
        {#if ref.value == null && loading.immediate}
            {#each { length: 3 } as _}
                {@render skeleton()}
            {/each}
        {:else if ref.value == null || ref.value.items.length === 0}
            <Row>
                <td class="text-base-fg-ghost col-span-full"> No projects found. </td>
            </Row>
        {:else}
            {#each ref.value.items as { id, identifier, name, createdTime, updatedTime } (id)}
                <Row class="relative">
                    <td class="text-base-fg-3 overflow-hidden text-ellipsis whitespace-nowrap">
                        <a
                            href="/{page.params['path']}/projects/{identifier}"
                            class="absolute inset-0"
                            aria-labelledby="project-{id}"
                        >
                        </a>
                        {identifier}
                    </td>
                    <td class="overflow-hidden text-ellipsis whitespace-nowrap">
                        <span id="project-{id}">
                            {name}
                        </span>
                    </td>
                    <td class="overflow-hidden text-ellipsis whitespace-nowrap">
                        <RelativeTime time={createdTime} />
                    </td>
                    <td class="overflow-hidden text-ellipsis whitespace-nowrap">
                        <RelativeTime time={updatedTime} />
                    </td>
                    {#if canDeleteProject}
                        <td class="isolate">
                            <div class="flex items-center">
                                <DeleteButton project={{ id, name }} {ref} />
                            </div>
                        </td>
                    {/if}
                </Row>
            {/each}
        {/if}
    </tbody>
</Table>
<Pagination3 {pagination}>
    {#snippet label({ from, to, totalCount })}
        Showing <strong>{from}</strong> to <strong>{to}</strong> of
        <strong>{totalCount}</strong> members.
    {/snippet}
</Pagination3>
