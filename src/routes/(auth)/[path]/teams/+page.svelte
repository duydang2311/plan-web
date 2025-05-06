<script lang="ts">
    import { page } from '$app/state';
    import { DateTime } from 'luxon';
    import { backInOut, circInOut } from 'svelte/easing';
    import { fade, scale } from 'svelte/transition';
    import {
        Button,
        Main,
        Pagination3,
        RelativeTime,
        Row,
        Spinner,
        Table,
        Th,
        THead,
        ThSort3
    } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import { paginatedList } from '~/lib/models/paginatedList';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { createPagination } from '~/lib/utils/table.svelte';
    import type { PageData } from './$types';

    const { data }: { data: PageData } = $props();
    const ref = createRef.maybePromise(() => data.teamList);
    const pagination = createPagination({
        syncList: () => ref.value ?? paginatedList(),
        syncUrl: () => page.url
    });
</script>

<Main>
    <div class="max-w-desktop mx-auto grid h-full grid-rows-[auto_minmax(24rem,1fr)_auto] gap-4">
        <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
            <div>
                <h1>Teams</h1>
                <p class="c-label">Organize teams and members within your workspace.</p>
            </div>
            <Button
                as="link"
                href="teams/new"
                variant="primary"
                class="flex items-center gap-2 capitalize max-sm:justify-center sm:w-fit"
            >
                <IconPlus />
                Add team
            </Button>
        </div>
        <div class="relative flex grow flex-col justify-between overflow-hidden">
            {#if ref.loading.short}
                <div
                    transition:fade={{ easing: circInOut }}
                    class="fixed inset-0 z-50 bg-black/10 backdrop-blur-sm"
                >
                    <div
                        transition:scale={{ easing: backInOut }}
                        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                        <Spinner class="text-primary-1 h-8 w-8" />
                    </div>
                </div>
            {/if}
            <div class="c-table--wrapper overflow-auto">
                <Table class="grid-cols-[1fr_auto_auto_auto]">
                    <THead>
                        <Row class="py-2">
                            <Th>Name</Th>
                            <Th>Identifier</Th>
                            <ThSort3 name="createdTime">Created</ThSort3>
                            <ThSort3 name="updatedTime">Updated</ThSort3>
                        </Row>
                    </THead>
                    <tbody class={[ref.loading.immediate && 'animate-pulse']}>
                        {#if ref.value == null && ref.loading}
                            <Row>
                                <td class="c-label col-span-full">Loading teams...</td>
                            </Row>
                        {:else if ref.value == null || ref.value.items.length === 0}
                            <Row>
                                <td class="c-label col-span-full">No teams found.</td>
                            </Row>
                        {:else}
                            {#each ref.value.items as { id, createdTime, updatedTime, name, identifier } (id)}
                                <Row class="relative">
                                    <td>
                                        <a
                                            href="/{page.params['path']}/teams/{identifier}"
                                            class="absolute inset-0"
                                            aria-labelledby="team-{id}"
                                        >
                                        </a>
                                        <span id="team-{id}">
                                            {name}
                                        </span>
                                    </td>
                                    <td>
                                        {identifier}
                                    </td>
                                    <td title={DateTime.fromISO(createdTime).toLocaleString()}>
                                        <RelativeTime time={createdTime} />
                                    </td>
                                    <td title={DateTime.fromISO(updatedTime).toLocaleString()}>
                                        <RelativeTime time={updatedTime} />
                                    </td>
                                </Row>
                            {/each}
                        {/if}
                    </tbody>
                </Table>
            </div>
        </div>
        {#if ref.value != null && ref.value.items.length > 0}
            <Pagination3 {pagination}>
                {#snippet label({ from, to, totalCount })}
                    Showing {from} - {to} of {totalCount} teams.
                {/snippet}
            </Pagination3>
        {/if}
    </div>
</Main>
