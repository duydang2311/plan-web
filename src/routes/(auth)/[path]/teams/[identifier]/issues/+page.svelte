<script lang="ts">
    import { beforeNavigate } from '$app/navigation';
    import { page } from '$app/stores';
    import clsx from 'clsx';
    import { DateTime } from 'luxon';
    import { backInOut, circInOut } from 'svelte/easing';
    import { fade, scale } from 'svelte/transition';
    import Button from '~/lib/components/Button.svelte';
    import Icon from '~/lib/components/Icon.svelte';
    import Link from '~/lib/components/Link.svelte';
    import Pagination from '~/lib/components/Pagination.svelte';
    import Row from '~/lib/components/Row.svelte';
    import Spinner from '~/lib/components/Spinner.svelte';
    import Table from '~/lib/components/Table.svelte';
    import Th from '~/lib/components/Th.svelte';
    import THead from '~/lib/components/THead.svelte';
    import { watch } from '~/lib/models/watchable';
    import type { PageData } from './$types';

    const { data }: { data: PageData } = $props();
    let list = $state(data.issueList);
    let status = $state<'pending' | 'pending-long'>();

    beforeNavigate(async ({ complete, from, to, type }) => {
        if (type === 'link' && from?.route.id === to?.route.id) {
            status = 'pending';
            watch(complete.catch(() => {})).after('1 second', () => (status = 'pending-long'));
        }
    });

    $effect(() => {
        if (data.issueList instanceof Promise) {
            status = 'pending';
            watch(data.issueList)
                .then((issueList) => {
                    list = issueList;
                })
                .after('1 second', () => {
                    status = 'pending-long';
                })
                .finally(() => {
                    status = undefined;
                });
        } else {
            list = data.issueList;
        }
    });
</script>

<main class="divide-y divide-base-border h-full flex flex-col">
    <div class="flex gap-4 justify-between items-center px-8 py-2">
        <p>Filter</p>
        <Button
            as="link"
            href="/{$page.params['path']}/teams/{$page.params['identifier']}/issues/new"
            variant="base"
            outline
            size="sm"
            class="w-fit flex items-center gap-1"
        >
            <Icon name="plus" />
            Add issue
        </Button>
    </div>
    <div class="flex flex-col grow justify-between overflow-auto">
        {#if status === 'pending-long'}
            <div
                transition:fade={{ easing: circInOut }}
                class="fixed backdrop-blur-sm z-50 inset-0 bg-black/10"
            >
                <div
                    transition:scale={{ easing: backInOut }}
                    class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                    <Spinner class="w-8 h-8 text-primary-1" />
                </div>
            </div>
        {/if}
        <Table>
            <colgroup>
                <col class="w-24" />
                <col class="lg:w-1/2" />
                <col />
                <col />
            </colgroup>
            <THead>
                <Row class="*:py-2 border-b-red-500">
                    <Th sortable name="title" colspan={2}>Title</Th>
                    <Th sortable name="createdTime">Created</Th>
                    <Th sortable name="updatedTime">Updated</Th>
                </Row>
            </THead>
            <tbody class={clsx(status === 'pending' && 'animate-twPulse')}>
                {#await list}
                    <Row>
                        <td colspan="4">Loading issues...</td>
                    </Row>
                {:then { items }}
                    {#if items.length}
                        {#each items as { id, createdTime, updatedTime, orderNumber, title }}
                            <Row>
                                <td>
                                    <div
                                        class="min-w-max block text-sm font-bold text-base-fg-3/60 content-center"
                                    >
                                        {data.team.identifier}-{orderNumber}
                                    </div>
                                </td>
                                <td>
                                    <Link href="/{$page.params['path']}/issues/{id}">{title}</Link>
                                </td>
                                <td>
                                    {DateTime.fromISO(createdTime).toLocaleString(
                                        DateTime.DATETIME_SHORT
                                    )}
                                </td>
                                <td>
                                    {DateTime.fromISO(updatedTime).toLocaleString(
                                        DateTime.DATETIME_SHORT
                                    )}
                                </td>
                            </Row>
                        {/each}
                    {:else}
                        <Row>
                            <td colspan="4">No issues yet.</td>
                        </Row>
                    {/if}
                {/await}
            </tbody>
        </Table>
        {#await list then { items, totalCount }}
            <Pagination
                size={data.query.size}
                offset={data.query.offset}
                length={items.length}
                {totalCount}
                page={data.query.page}
            >
                {#snippet label({ from, to, totalCount })}
                    Displaying {from} - {to} out of {totalCount} issues.
                {/snippet}
            </Pagination>
        {/await}
    </div>
</main>
