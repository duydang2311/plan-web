<script lang="ts">
    import { createQuery } from '@tanstack/svelte-query';
    import { toStore } from 'svelte/store';
    import { createFetchIssueAuditListQuery } from './utils';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { QueryResponse } from '~/lib/utils/query';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { LocalIssueAudit } from './+page.server';
    import { IssueAuditActions } from '~/lib/models/issue';
    import AuditCreate from './AuditCreate.svelte';

    const { issueId }: { issueId: string } = $props();
    const { api } = useRuntime();
    const query = createQuery(
        toStore(() => {
            const query = createFetchIssueAuditListQuery(() => ({ issueId }));
            return {
                queryKey: ['issue-audits', query],
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get('issue-audits', { query })
                    );
                    return await QueryResponse.JSON(() =>
                        response.json<PaginatedList<LocalIssueAudit>>()
                    );
                }
            };
        })
    );
    const auditComponents = {
        [IssueAuditActions.create]: AuditCreate
    } as const;
</script>

{#if $query.isPending}
    Loading issue activities...
{:else if $query.data}
    <ol class="space-y-4 px-4" class:animate-pulse={$query.isFetching}>
        {#each $query.data.items as audit (audit.id)}
            {#if audit.action in auditComponents}
                {@const Component = auditComponents[audit.action as keyof typeof auditComponents]}
                <li>
                    <Component {audit} />
                </li>
            {:else}
                Audit {audit.action}
            {/if}
        {/each}
    </ol>
{/if}
