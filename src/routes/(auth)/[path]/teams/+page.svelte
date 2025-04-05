<script lang="ts">
    import { page } from '$app/state';
    import { DateTime } from 'luxon';
    import { backInOut, circInOut } from 'svelte/easing';
    import { fade, scale } from 'svelte/transition';
    import {
        Button,
        Input,
        Pagination3,
        RelativeTime,
        Row,
        Spinner,
        Table,
        THead,
        ThSort3
    } from '~/lib/components';
    import { IconPlus, IconSearch } from '~/lib/components/icons';
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
    $inspect(ref.value);
</script>

<main class="divide-base-border-2 flex h-full flex-col divide-y">
    <div class="divide-base-border-3 flex items-stretch justify-between divide-x">
        <div class="relative grow content-center pl-8">
            <Input
                type="text"
                class="h-full border-transparent py-0 pl-6 active:outline-none"
                placeholder="Search for teams..."
            />
            <IconSearch class="text-base-fg-ghost absolute left-8 top-1/2 -translate-y-1/2" />
        </div>
        <Button
            as="link"
            href="teams/new"
            flat
            variant="base"
            size="sm"
            class="flex w-fit items-center gap-1 pr-8"
        >
            <IconPlus />
            Add team
        </Button>
    </div>
    <div class="relative flex grow flex-col justify-between overflow-auto">
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
        <Table class="grid-cols-[1fr_auto_auto_auto]">
            <THead>
                <Row class="py-2">
                    <ThSort3 name="name">Name</ThSort3>
                    <ThSort3 name="identifier">Identifier</ThSort3>
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
        <Pagination3 {pagination}>
            {#snippet label({ from, to, totalCount })}
                Showing {from} to {to} of {totalCount} teams.
            {/snippet}
        </Pagination3>
    </div>
</main>
