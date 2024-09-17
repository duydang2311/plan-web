<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import type { PageData } from './$types';
    import { invalidate } from '$app/navigation';
    import { IconButton, Icon, Row, Table, Th, THead, Pagination, Link } from '~/lib/components';
    import { DateTime } from 'luxon';
    import { page } from '$app/stores';

    const { data }: { data: PageData } = $props();
    const query = createQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            await invalidate('fetch:projects');
            return data.projects;
        }
    });
</script>

<main class="h-full flex flex-col justify-between overflow-auto">
    <Table style="grid-template-columns: auto 1fr auto auto max-content;">
        <THead>
            <Row class="py-2">
                <Th name="identifier" sortable>Identifier</Th>
                <Th name="name" sortable>Name</Th>
                <Th name="createdTime" sortable>Created</Th>
                <Th name="updatedTime" sortable>Updated</Th>
                <Th></Th>
            </Row>
        </THead>
        <tbody>
            {#if !$query.data || $query.data.items.length === 0}
                <Row>
                    <td style="grid-column: 1 / -1;">
                        <span class="text-base-fg-ghost"><italic>No projects yet.</italic></span>
                    </td>
                </Row>
            {:else}
                {#each $query.data.items as { id, identifier, name, createdTime, updatedTime } (id)}
                    <Row>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis text-base-fg-3"
                            title={identifier}>{identifier}</td
                        >
                        <td class="whitespace-nowrap overflow-hidden text-ellipsis">
                            <Link
                                href="/{$page.params['path']}/projects/{identifier}/issues"
                                title={name}
                            >
                                {name}
                            </Link>
                        </td>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={createdTime}
                        >
                            {DateTime.fromISO(createdTime).toLocaleString(DateTime.DATE_MED)}
                        </td>
                        <td
                            class="whitespace-nowrap overflow-hidden text-ellipsis"
                            title={updatedTime}
                        >
                            {DateTime.fromISO(updatedTime).toLocaleString(DateTime.DATE_MED)}
                        </td>
                        <td>
                            <div class="flex flex-wrap gap-2">
                                <IconButton
                                    type="button"
                                    variant="negative"
                                    title="Remove member"
                                    class="w-fit"
                                >
                                    <Icon name="trash" />
                                </IconButton>
                            </div>
                        </td>
                    </Row>
                {/each}
            {/if}
        </tbody>
    </Table>
    {#if $query.data}
        <Pagination query={data.query} list={$query.data}>
            {#snippet label({ from, to, totalCount })}
                Displaying {from} - {to} out of {totalCount} members.
            {/snippet}
        </Pagination>
    {/if}
</main>
