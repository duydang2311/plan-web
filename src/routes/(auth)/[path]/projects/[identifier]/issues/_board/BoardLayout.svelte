<script lang="ts">
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { LocalBoardIssue, LocalWorkspaceStatus } from '../+page.server';
    import BoardLayoutDefault from './BoardLayoutDefault.svelte';
    import BoardLayoutSkeleton from './BoardLayoutSkeleton.svelte';
    import { Await } from '~/lib/components';

    const {
        statusList,
        issueLists,
        projectId,
        projectIdentifier
    }: {
        statusList: MaybePromise<PaginatedList<LocalWorkspaceStatus>>;
        issueLists: MaybePromise<Record<PropertyKey, PaginatedList<LocalBoardIssue>>>;
        projectId: string;
        projectIdentifier: string;
    } = $props();
</script>

<Await resolve={statusList}>
    {#snippet children({ value, loading })}
        {#if value == null}
            {#if loading.immediate}
                <BoardLayoutSkeleton />
            {:else}
                <p class="c-label">No status found.</p>
            {/if}
        {:else}
            <BoardLayoutDefault
                statusList={{
                    items: [{ id: -1, value: 'No status', color: '' }, ...value.items],
                    totalCount: value.totalCount + 1
                }}
                {issueLists}
                {loading}
                {projectId}
                {projectIdentifier}
            />
        {/if}
    {/snippet}
</Await>
