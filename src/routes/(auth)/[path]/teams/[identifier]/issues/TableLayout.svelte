<script lang="ts">
    import { invalidate } from '$app/navigation';
    import { createQuery, useQueryClient } from '@tanstack/svelte-query';
    import { unwrapMaybePromise } from '~/lib/utils/promise';
    import { createEffect } from '~/lib/utils/runes.svelte';
    import type { PageData } from './$types';
    import IssueTable from '~/lib/components/issues/IssueTable.svelte';
    import { Pagination } from '~/lib/components';

    const { data }: { data: PageData } = $props();
    const queryClient = useQueryClient();
    const queryKey = ['issues'];
    const query = createQuery({
        queryKey,
        queryFn: async () => {
            await invalidate('fetch:issues');
            return await data.issueList!;
        }
    });

    createEffect(
        () => {
            if (data.issueList !== $query.data) {
                unwrapMaybePromise(data.issueList)((a) => queryClient.setQueryData(queryKey, a));
            }
        },
        () => data.issueList
    );
</script>

<div class="grow overflow-auto">
    <IssueTable
        issues={$query.data
            ? {
                  items: $query.data.items.map((a) => ({ ...a, identifier: data.team.identifier })),
                  totalCount: $query.data.totalCount
              }
            : undefined}
        status={$query.isFetching ? 'loading' : undefined}
    />
</div>
{#if $query.data && data.query}
    <Pagination {...data.query} list={$query.data}>
        {#snippet label({ from, to, totalCount })}
            Displaying {from} - {to} out of {totalCount} issues.
        {/snippet}
    </Pagination>
{/if}
