<script lang="ts">
    import { browser } from '$app/environment';
    import { page } from '$app/state';
    import { createQuery, keepPreviousData } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import IssueDatatable from '~/lib/components/issues/IssueDatatable.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { QueryResponse } from '~/lib/utils/query';
    import { createSort, paginationHelper, sortHelper } from '~/lib/utils/table.svelte';
    import type { PageData } from './$types';
    import type { LocalIssue } from './+page.server';
    import { createIssueListQueryParams } from './utils';

    const { data }: { data: PageData } = $props();
    const { api } = useRuntime();
    const sort = createSort({
        fields: page.url.searchParams.get('order') ?? undefined,
        onDirectionChange: browser ? sortHelper.replaceState(page.url) : undefined
    });
    const pagination = paginationHelper.createPagination(page.url);
    const query = createQuery(
        toStore(() => {
            const params = createIssueListQueryParams(() => ({
                projectId: data.project.id,
                url: page.url,
                page: pagination.page,
                size: pagination.rowsPerPage,
                order: sort.string
            }));
            return {
                queryKey: [
                    'issues',
                    {
                        layout: 'table',
                        params
                    }
                ],
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get(`issues`, {
                            query: params
                        })
                    );
                    return await QueryResponse.JSON(() =>
                        response.json<PaginatedList<LocalIssue>>()
                    );
                },
                placeholderData: keepPreviousData
            };
        })
    );
    pagination.sync(() => $query.data);
</script>

<IssueDatatable
    {query}
    {sort}
    {pagination}
    buildIssueHref={({ orderNumber }) =>
        `/${page.params.path}/projects/${page.params.identifier}/issues/${orderNumber}`}
/>
