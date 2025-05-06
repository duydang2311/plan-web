<script lang="ts">
    import { page } from '$app/state';
    import { RelativeTime, Row, Table, Th, THead, ThSort3 } from '~/lib/components';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { type AsyncRef } from '~/lib/utils/runes.svelte';
    import type { LocalProject } from './+page.server';
    import DeleteButton from './DeleteButton.svelte';

    const {
        projectListRef,
        canDelete
    }: {
        projectListRef: AsyncRef<PaginatedList<LocalProject>>;
        canDelete: boolean;
    } = $props();
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

<div class="c-table--wrapper relative h-full overflow-auto">
    <Table
        class={[
            'grid-cols-[auto_1fr_auto_auto_auto]',
            projectListRef.loading.immediate && 'animate-pulse'
        ]}
    >
        <THead>
            <Row class="py-2">
                <Th>Identifier</Th>
                <Th>Name</Th>
                <ThSort3 name="createdTime">Created</ThSort3>
                <ThSort3 name="updatedTime">Updated</ThSort3>
                {#if canDelete}
                    <Th></Th>
                {/if}
            </Row>
        </THead>
        <tbody>
            {#if projectListRef.isInitialLoading}
                {#each { length: 3 } as _}
                    {@render skeleton()}
                {/each}
            {:else if projectListRef.value == null || projectListRef.value.items.length === 0}
                <Row>
                    <td class="text-base-fg-ghost col-span-full">No projects found.</td>
                </Row>
            {:else}
                {#each projectListRef.value.items as { id, identifier, name, createdTime, updatedTime } (id)}
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
                        {#if canDelete}
                            <td class="isolate">
                                <div class="flex items-center">
                                    <DeleteButton project={{ id, name }} ref={projectListRef} />
                                </div>
                            </td>
                        {/if}
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
</div>
