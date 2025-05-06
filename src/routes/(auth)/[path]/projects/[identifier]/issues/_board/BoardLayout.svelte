<script lang="ts">
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import type { AsyncRef } from '~/lib/utils/runes.svelte';
    import type { LocalBoardIssue, LocalWorkspaceStatus } from '../+page.server';
    import BoardLayoutDefault from './BoardLayoutDefault.svelte';
    import BoardLayoutSkeleton from './BoardLayoutSkeleton.svelte';
    import { StatusCategory } from '~/lib/models/status';

    const {
        statusListRef,
        issueListsRef,
        projectId,
        projectIdentifier
    }: {
        statusListRef: AsyncRef<PaginatedList<LocalWorkspaceStatus>>;
        issueListsRef: AsyncRef<Record<PropertyKey, PaginatedList<LocalBoardIssue>>>;
        projectId: string;
        projectIdentifier: string;
    } = $props();
</script>

{#if statusListRef.isInitialLoading}
    <BoardLayoutSkeleton />
{:else if statusListRef.value == null || statusListRef.value.items.length === 0}
    <p class="c-label">No status found.</p>
{:else}
    <BoardLayoutDefault
        statusList={{
            items: [
                { id: -1, value: 'No status', color: '', category: StatusCategory.Pending },
                ...statusListRef.value.items
            ],
            totalCount: statusListRef.value.totalCount + 1
        }}
        {issueListsRef}
        {projectId}
        {projectIdentifier}
    />
{/if}
