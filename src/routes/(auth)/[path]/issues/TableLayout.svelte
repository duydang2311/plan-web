<script lang="ts">
    import { page } from '$app/stores';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { derived as derivedStore } from 'svelte/store';
    import { Pagination } from '~/lib/components';
    import IssueTable from '~/lib/components/issues/IssueTable.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { unwrapMaybePromise } from '~/lib/utils/promise';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import type { PageData } from './$types';
    import type { LocalIssue } from './+page.server';
    import { createQueryKey, createQueryParams } from './utils';

    const { data }: { data: PageData } = $props();
    const { api } = useRuntime();
    const queryClient = useQueryClient();
    const queryInfo = derivedStore(page, ($page) => ({
        key: createQueryKey($page.url, { layout: 'table' }),
        params: createQueryParams($page.url)
    }));
    const query = createQuery(
        derivedStore(queryInfo, ($queryInfo) => ({
            queryKey: $queryInfo.key,
            queryFn: async () => {
                const response = await api.get(`issues`, { query: $queryInfo.params });
                return await response.json<PaginatedList<LocalIssue>>();
            },
            refetchInterval: 1000
        }))
    );

    createEffect(
        () => {
            if (data.layout === 'table') {
                unwrapMaybePromise(data.page)((a) => {
                    queryClient.setQueryData($queryInfo.key, a.issueList);
                });
            }
        },
        () => [data.layout, data.page, $queryInfo]
    );
</script>

<IssueTable
    issues={$query.data
        ? {
              items: $query.data.items.map((a) => ({ ...a, identifier: a.project.identifier })),
              totalCount: $query.data.totalCount
          }
        : undefined}
    status={$query.isFetching ? 'loading' : undefined}
/>
{#if $query.data}
    <Pagination {...$queryInfo.params} list={$query.data} />
{/if}
