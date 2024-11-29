<script lang="ts">
    import { page } from '$app/stores';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { derived as derivedStore } from 'svelte/store';
    import { Button, Icon, Pagination } from '~/lib/components';
    import IssueTable from '~/lib/components/issues/IssueTable.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { unwrapMaybePromise } from '~/lib/utils/promise';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import { paginatedQuery, queryParams, stringifyQuery } from '~/lib/utils/url';
    import type { PageData } from './$types';
    import type { LocalIssue } from './+page.server';
    import { createQueryKey, createQueryParams } from './utils';

    const { data }: { data: PageData } = $props();
    const { httpClient } = useRuntime();
    const queryClient = useQueryClient();
    const queryInfo = derivedStore(page, ($page) => ({
        key: createQueryKey($page.url),
        params: createQueryParams($page.url)
    }));
    const createIssueHref = $derived.by(() => {
        const team = $page.url.searchParams.get('team');
        const project = $page.url.searchParams.get('project');
        return `/${$page.params['path']}/issues/new${stringifyQuery({ team, project }, { includeQuestionMark: true })}`;
    });
    const query = createQuery(
        derivedStore(queryInfo, ($queryInfo) => ({
            queryKey: $queryInfo.key,
            queryFn: async () => {
                const response = await httpClient.get(
                    `/api/issues?${stringifyQuery($queryInfo.params)}`
                );
                return await response.json<PaginatedList<LocalIssue>>();
            }
        }))
    );
    const paginationQuery = $derived(paginatedQuery(queryParams($page.url, { page: 1, size: 20 })));

    createEffect(
        () => {
            unwrapMaybePromise(data.page)((a) => {
                queryClient.setQueryData($queryInfo.key, a.issueList);
            });
        },
        () => [data.page, $queryInfo]
    );
</script>

<main class="grid grid-rows-[auto_1fr_auto] h-full overflow-auto">
    <div class="px-6 py-1 flex justify-between border-b border-b-base-border-2">
        <div>Filter</div>
        <Button
            as="link"
            href={createIssueHref}
            variant="base"
            filled={false}
            size="sm"
            class="flex items-center gap-2 w-fit"
        >
            <Icon name="plus" />
            Create issue
        </Button>
    </div>
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
        <Pagination {...paginationQuery} list={$query.data} />
    {/if}
</main>
