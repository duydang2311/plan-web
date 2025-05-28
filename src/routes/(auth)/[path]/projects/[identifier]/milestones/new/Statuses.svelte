<script lang="ts">
    import type { Snippet } from 'svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { type PaginatedList } from '~/lib/models/paginatedList';
    import { createStatusListQuery, type LocalMilestoneStatus } from './utils.client';

    const {
        projectId,
        children
    }: { projectId: string; children: Snippet<[PaginatedList<LocalMilestoneStatus>]> } = $props();
    const { api } = useRuntime();
    const query = createStatusListQuery(api)(projectId);
</script>

{#if $query.isPending}
    <span class="c-text-secondary">Loading...</span>
{:else if $query.error}
    <span class="c-text-secondary">
        Something went wrong while loading milestone statuses:
        <strong>{$query.error.message}</strong>.
    </span>
{:else if $query.data.items.length === 0}
    <span class="c-text-secondary">No milestone statuses found.</span>
{:else}
    {@render children($query.data)}
{/if}
