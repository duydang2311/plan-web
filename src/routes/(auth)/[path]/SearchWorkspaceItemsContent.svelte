<script lang="ts">
    import { resource, type ResourceReturn } from 'runed';
    import type { Snippet } from 'svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { QueryResponse } from '~/lib/utils/query';

    const {
        workspaceId,
        search,
        children
    }: {
        workspaceId: string;
        search: string;
        children: Snippet<[ResourceReturn<PaginatedList<unknown> | null>]>;
    } = $props();

    const { api } = useRuntime();
    const issueListResource = resource(
        () => search,
        async (search) => {
            if (search.length <= 0) {
                return null;
            }
            return QueryResponse.HTTP(() =>
                api.get(`workspaces/${workspaceId}/search`, {
                    query: {
                        query: search,
                        selectIssue: 'Id,OrderNumber,Title,Project.Identifier',
                        selectProject: 'Id,Identifier,Name',
                        size: 10,
                        threshold: 0.05
                    }
                })
            ).then((a) => a.json<PaginatedList<unknown>>());
        },
        { debounce: 200, throttle: 600 }
    );
</script>

{@render children(issueListResource)}
