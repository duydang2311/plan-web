<script lang="ts">
    import { page } from '$app/state';
    import { DateTime } from 'luxon';
    import { Button } from '~/lib/components';
    import { IconArrowRight, IconChevronRight } from '~/lib/components/icons';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { Loading } from '~/lib/utils/runes.svelte';
    import type { LocalIssue } from './+page.server';

    const {
        issueList,
        loading
    }: { issueList: PaginatedList<LocalIssue> | undefined; loading: Loading } = $props();
</script>

{#snippet skeleton()}
    <li
        class="group relative grid animate-pulse grid-cols-[auto_1fr_auto] items-center gap-4 p-2 *:h-6 *:rounded"
    >
        <div class="bg-base-3 w-16"></div>
        <div class="bg-base-3 w-full"></div>
        <div class="bg-base-3 w-32"></div>
    </li>
{/snippet}

<section class="mt-8">
    <div class="flex justify-between">
        <h2>Issues</h2>
        <Button
            as="link"
            href="/{page.params.path}/projects/{page.params.identifier}/issues"
            variant="base"
            filled={false}
            size="sm"
            class="flex w-fit items-center gap-2"
        >
            <IconArrowRight />
            See more
        </Button>
    </div>
    {#if issueList == null && loading.immediate}
        <ol class="mt-2">
            {#each { length: Math.floor(Math.random() * 5) + 2 } as _}
                {@render skeleton()}
            {/each}
        </ol>
    {:else if issueList == null || issueList.items.length === 0 || issueList.totalCount === 0}
        <span class="text-base-fg-ghost text-sm font-medium">No issues available.</span>
    {:else}
        <ol class="mt-2" class:animate-pulse={loading.immediate}>
            {#each issueList.items as item (item.id)}
                {@const created = DateTime.fromISO(item.createdTime)}
                <li>
                    <a
                        href="/{page.params.path}/projects/{page.params
                            .identifier}/issues/{item.orderNumber}"
                        class={[
                            'group relative grid grid-cols-[auto_1fr_auto] items-center gap-4 rounded p-2 transition-[color_background-color_padding]',
                            'hover:bg-base-3 hover:text-base-fg-1 hover:pl-8'
                        ]}
                    >
                        <IconChevronRight
                            class="absolute left-0 top-1/2 -translate-y-1/2 translate-x-0 transform opacity-0 transition-[opacity_transform] group-hover:translate-x-1/2 group-hover:opacity-100"
                        />
                        <div
                            class="text-base-fg-5 overflow-hidden whitespace-nowrap text-sm font-medium tracking-tight"
                        >
                            {page.params.identifier}-{item.orderNumber}
                        </div>
                        <div class="overflow-hidden text-ellipsis whitespace-nowrap font-medium">
                            {item.title}
                        </div>
                        <div
                            class="text-base-fg-5 overflow-hidden text-ellipsis whitespace-nowrap text-sm"
                            title={created.toLocaleString(DateTime.DATETIME_MED)}
                        >
                            created {created.toRelative()}
                        </div>
                    </a>
                </li>
            {/each}
        </ol>
    {/if}
</section>
