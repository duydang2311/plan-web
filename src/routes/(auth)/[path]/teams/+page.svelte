<script lang="ts">
    import { navigating, page } from '$app/state';
    import { A, pipe } from '@mobily/ts-belt';
    import clsx from 'clsx';
    import { DateTime } from 'luxon';
    import { orderBy } from 'natural-orderby';
    import { backInOut, circInOut } from 'svelte/easing';
    import { fade, scale } from 'svelte/transition';
    import Button from '~/lib/components/Button.svelte';
    import { IconPlus, IconSettings } from '~/lib/components/icons';
    import Link from '~/lib/components/Link.svelte';
    import Pagination from '~/lib/components/Pagination.svelte';
    import Row from '~/lib/components/Row.svelte';
    import Spinner from '~/lib/components/Spinner.svelte';
    import Table from '~/lib/components/Table.svelte';
    import Th from '~/lib/components/Th.svelte';
    import THead from '~/lib/components/THead.svelte';
    import { paginatedList } from '~/lib/models/paginatedList';
    import { watch } from '~/lib/models/watchable';
    import { mapMaybePromise } from '~/lib/utils/promise';
    import type { PageData } from './$types';

    const { data }: { data: PageData } = $props();
    let teamList = $state(data.teamList);
    let status = $state<'pending' | 'pending-long'>();

    const orders = $derived.by(() => {
        const order = navigating?.to?.url.searchParams.get('order');
        if (!order) return null;
        return pipe(
            order.split(','),
            A.map((a) => {
                let desc = a[0] === '-';
                return [desc ? a.substring(1) : a, desc ? 'desc' : 'asc'] as const;
            }),
            A.filter(
                (a): a is ['name' | 'identifier' | 'createdTime' | 'updatedTime', 'desc' | 'asc'] =>
                    a[0] === 'name' ||
                    a[0] === 'identifier' ||
                    a[0] === 'createdTime' ||
                    a[0] === 'updatedTime'
            )
        );
    });

    const sorted = $derived.by(() => {
        if (!orders) return teamList;
        return mapMaybePromise(teamList)((list) =>
            paginatedList({
                items: orderBy(
                    list.items,
                    orders.map(
                        ([x]) =>
                            (v) =>
                                v[x]
                    ),
                    orders.map(([, x]) => x)
                ),
                totalCount: list.totalCount
            })
        );
    });

    $effect(() => {
        if (data.teamList instanceof Promise) {
            status = 'pending';
            watch(data.teamList.then((v) => (teamList = v)))
                .after('1 second', () => (status = 'pending-long'))
                .finally(() => (status = undefined));
        }
    });
</script>

<main class="divide-base-border-2 flex h-full flex-col divide-y">
    <div class="flex items-center justify-between gap-4 px-8 py-2">
        <p>Filter</p>
        <Button
            as="link"
            href="teams/new"
            variant="base"
            size="sm"
            class="-mr-4 flex w-fit items-center gap-1"
        >
            <IconPlus />
            Add team
        </Button>
    </div>
    <div class="relative flex grow flex-col justify-between overflow-auto">
        {#if status === 'pending-long'}
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
        <Table style="grid-template-columns: 1fr auto auto auto auto;">
            <THead>
                <Row class="py-2">
                    <Th sortable name="name">Name</Th>
                    <Th sortable name="identifier">Identifier</Th>
                    <Th sortable name="createdTime">Created</Th>
                    <Th sortable name="updatedTime">Updated</Th>
                    <Th></Th>
                </Row>
            </THead>
            <tbody
                class={clsx((status === 'pending' || status === 'pending-long') && 'animate-pulse')}
            >
                {#await sorted}
                    <Row>
                        <td style="grid-column: 1 / -1;">Loading teams...</td>
                    </Row>
                {:then { items }}
                    {#if items.length}
                        {#each items as { createdTime, updatedTime, name, identifier }}
                            <Row>
                                <td>
                                    <Link href="/{page.params['path']}/issues?team={identifier}">
                                        {name}
                                    </Link>
                                </td>
                                <td>{identifier}</td>
                                <td>
                                    {DateTime.fromISO(createdTime).toLocaleString(
                                        DateTime.DATE_MED
                                    )}
                                </td>
                                <td>
                                    {DateTime.fromISO(updatedTime).toLocaleString(
                                        DateTime.DATE_MED
                                    )}
                                </td>
                                <td>
                                    <div class="flex gap-2">
                                        <Button
                                            as="link"
                                            href="/{page.params[
                                                'path'
                                            ]}/teams/{identifier}/settings"
                                            variant="base"
                                            class="text-base-fg-3 hover:text-base-fg-1 w-fit p-1"
                                            filled={false}
                                        >
                                            <IconSettings />
                                        </Button>
                                    </div>
                                </td>
                            </Row>
                        {/each}
                    {:else}
                        <Row>
                            <td style="grid-column: 1 / -1;">No active teams yet.</td>
                        </Row>
                    {/if}
                {/await}
            </tbody>
        </Table>
        {#await teamList then list}
            <Pagination query={data.query} {list}>
                {#snippet label({ from, to, totalCount })}
                    Displaying {from} - {to} out of {totalCount} teams.
                {/snippet}
            </Pagination>
        {/await}
    </div>
</main>
