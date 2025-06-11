<script lang="ts">
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { StatusCategory } from '~/lib/models/status';
    import { type AsyncRef } from '~/lib/utils/runes.svelte';
    import type { LocalBoardIssue, LocalWorkspaceStatus } from '../+page.server';
    import BoardLayoutDefault from './BoardLayoutDefault.svelte';
    import BoardLayoutSkeleton from './BoardLayoutSkeleton.svelte';

    const {
        statusListRef,
        issueListsRef,
        projectId,
        projectIdentifier
    }: {
        statusListRef: AsyncRef<PaginatedList<LocalWorkspaceStatus> | null>;
        issueListsRef: AsyncRef<Record<PropertyKey, PaginatedList<LocalBoardIssue>>>;
        issueLists: any;
        projectId: string;
        projectIdentifier: string;
    } = $props();
</script>

{#if statusListRef.isInitialLoading || statusListRef.value == null}
    <BoardLayoutSkeleton />
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
