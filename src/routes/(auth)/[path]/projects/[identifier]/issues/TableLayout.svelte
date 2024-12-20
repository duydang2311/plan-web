<script lang="ts">
    import { page } from '$app/state';
    import { createQuery, keepPreviousData, useQueryClient } from '@tanstack/svelte-query';
    import { type State, TableHandler } from '@vincjo/datatables/server';
    import { toStore } from 'svelte/store';
    import IssueDatatable from '~/lib/components/issues/IssueDatatable.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { unwrapMaybePromise } from '~/lib/utils/promise';
    import { watch } from '~/lib/utils/runes.svelte';
    import type { PageData } from './$types';
    import type { LocalIssue } from './+page.server';

    const { data }: { data: PageData } = $props();
    const { api } = useRuntime();
    const queryClient = useQueryClient();
    const getParams = (state?: State<LocalIssue>) => {
        let order = 'OrderNumber';
        if (state?.sort) {
            const field = state.sort.field === 'status' ? 'status.rank' : state.sort.field;
            order = `${state.sort.direction === 'desc' ? '-' : ''}${field}`;
        }
        return {
            projectId: data.project.id,
            offset: state?.offset ?? 0,
            size: state?.rowsPerPage ?? 20,
            order
        };
    };
    let tableState = $state<State<LocalIssue>>();
    const queryKey = $derived([
        'issues',
        {
            layout: 'table',
            params: getParams(tableState)
        }
    ]);
    const query = createQuery(
        toStore(() => ({
            queryKey: queryKey,
            queryFn: async () => {
                const response = await api.get(`issues`, {
                    query: {
                        ...getParams(tableState),
                        select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,Project.Identifier,Status.Value,Status.Rank,Priority'
                    }
                });
                return await response.json<PaginatedList<LocalIssue>>();
            },
            placeholderData: keepPreviousData
        }))
    );
    const table = new TableHandler<LocalIssue>($query.data?.items, {
        rowsPerPage: 20,
        totalRows: $query.data?.totalCount ?? 0
    });
    table.on('change', () => {
        tableState = table.getState();
    });

    watch(() => $query.data)(() => {
        table.totalRows = $query.data?.totalCount ?? 0;
    });

    watch(() => data.page)(() => {
        if (data.page.tag === 'table' && data.page.streamed instanceof Promise) {
            unwrapMaybePromise(data.page.streamed)((a) => {
                queryClient.setQueryData(queryKey, a.issueList);
            });
        }
    });
</script>

<IssueDatatable
    {table}
    {query}
    buildIssueHref={({ orderNumber }) =>
        `/${page.params.path}/projects/${page.params.identifier}/issues/${orderNumber}`}
/>
