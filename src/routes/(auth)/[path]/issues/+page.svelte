<script lang="ts">
    import { page } from '$app/stores';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { derived as derivedStore } from 'svelte/store';
    import IssueTable from '~/lib/components/issues/IssueTable.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { paginatedQuery, queryParams } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import type { LocalIssue } from './+page.server';
    import { createQueryKey } from './utils';
    import { Button, Icon, Pagination } from '~/lib/components';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import { unwrapMaybePromise } from '~/lib/utils/promise';

    const { data }: { data: PageData } = $props();
    const { httpClient } = useRuntime();
    const queryClient = useQueryClient();
    const queryKey = derivedStore(page, ($page) => createQueryKey($page.url));
    const query = createQuery(
        derivedStore(queryKey, ($queryKey) => ({
            queryKey: $queryKey,
            queryFn: async () => {
                const response = await httpClient.get(`/api/issues?${data.issueQueryParams}`);
                return await response.json<PaginatedList<LocalIssue>>();
            }
        }))
    );
    const paginationQuery = $derived(paginatedQuery(queryParams($page.url, { page: 1, size: 20 })));

    createEffect(
        () => {
            unwrapMaybePromise(data.issueList)((a) => {
                queryClient.setQueryData($queryKey, (b) => {
                    console.log(b);
                    return a;
                });
            });
        },
        () => data.issueList
    );
</script>

<main class="grid grid-rows-[auto_1fr_auto] h-full overflow-auto">
    <div class="px-6 py-1 flex justify-between border-b border-b-base-border-2">
        <div>Filter</div>
        <Button variant="base" filled={false} size="sm" class="flex items-center gap-2 w-fit">
            <Icon name="plus" />
            Create issue
        </Button>
    </div>
    <IssueTable
        issues={$query.data
            ? {
                  items: $query.data.items.map((a) => ({ ...a, identifier: a.team.identifier })),
                  totalCount: $query.data.totalCount
              }
            : undefined}
        status={$query.isFetching ? 'loading' : undefined}
    />
    {#if $query.data}
        <Pagination {...paginationQuery} list={$query.data} />
    {/if}
</main>
