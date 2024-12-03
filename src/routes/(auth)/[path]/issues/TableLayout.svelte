<script lang="ts">
    import { page } from '$app/stores';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { derived as derivedStore } from 'svelte/store';
    import { Pagination } from '~/lib/components';
    import IssueTable from '~/lib/components/issues/IssueTable.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { mapMaybePromise, unwrapMaybePromise } from '~/lib/utils/promise';
    import type { PageData } from './$types';
    import type { LocalIssue } from './+page.server';
    import { createQueryKey, createQueryParams } from './utils';
    import { createEffect } from '~/lib/utils/runes.svelte';

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
                if (data.tag !== 'table') {
                    return null;
                }
                const query = await mapMaybePromise(data.page, (a) => {
                    return {
                        ...$queryInfo.params,
                        projectId: a.projectId,
                        teamId: a.teamId
                    };
                });
                const response = await api.get(`issues`, { query });
                return await response.json<PaginatedList<LocalIssue>>();
            }
        }))
    );

    createEffect(
        () => {
            if (data.tag === 'table') {
                unwrapMaybePromise(data.page)((a) => {
                    queryClient.setQueryData($queryInfo.key, a.issueList);
                });
            }
        },
        () => data.page
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
