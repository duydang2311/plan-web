<script lang="ts">
    import { enhance } from '$app/forms';
    import type { SubmitFunction } from '@sveltejs/kit';
    import { resource } from 'runed';
    import { Button, Field, Input, Label } from '~/lib/components';
    import { IconLink } from '~/lib/components/icons';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { ChecklistItemKind } from '~/lib/models/checklist';
    import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
    import { mapMaybePromise } from '~/lib/utils/promise';
    import { QueryResponse } from '~/lib/utils/query';
    import type { LocalSearchIssue } from './types';

    const {
        projectId,
        issueId,
        onLinkSubmit
    }: {
        projectId: string;
        issueId: string;
        onLinkSubmit: (
            subIssue: LocalSearchIssue,
            e: Parameters<SubmitFunction>[0]
        ) => ReturnType<SubmitFunction>;
    } = $props();
    let search = $state.raw('');
    const { api } = useRuntime();
    const issueListResource = resource(
        () => search,
        async (search) => {
            const select = 'CreatedTime,Id,OrderNumber,Title,Project.Identifier';
            if (search.length <= 0) {
                return QueryResponse.HTTP(() =>
                    api.get('issues', {
                        query: {
                            projectId,
                            select,
                            size: 5,
                            excludeChecklistItemParentIssueId: issueId,
                            excludeIssueIds: [issueId]
                        }
                    })
                ).then((a) => a.json<PaginatedList<LocalSearchIssue>>());
            }
            return QueryResponse.HTTP(() =>
                api.get('issues/search', {
                    query: {
                        projectId,
                        select,
                        query: search,
                        size: 5,
                        excludeChecklistItemParentIssueId: issueId,
                        excludeIssueIds: [issueId],
                        threshold: 0.1
                    }
                })
            ).then((a) => a.json<PaginatedList<LocalSearchIssue>>());
        },
        { debounce: 200, throttle: 600 }
    );
</script>

<div>
    <Field>
        <Label for="search">Search by task number, title or description</Label>
        <Input type="search" id="search" bind:value={search} placeholder="Search tasks..." />
    </Field>
    <div class="border-base-border-3 bg-base-1 mt-2 h-48 overflow-auto rounded-lg border">
        {#if issueListResource.current == null && issueListResource.loading}
            <div class="p-2">
                <span class="c-text-secondary">Loading...</span>
            </div>
        {:else if issueListResource.error}
            <div class="c-text-secondary p-2">
                <p>Something went wrong while searching for tasks.</p>
                <pre>{JSON.stringify(issueListResource.error)}</pre>
            </div>
        {:else if issueListResource.current == null || issueListResource.current.items.length <= 0}
            <div class="p-2">
                <span class="c-text-secondary">No tasks found.</span>
            </div>
        {:else}
            <ul
                class="divide-base-border-3 grid grid-cols-[auto_1fr_auto] items-center divide-y"
                class:animate-pulse={issueListResource.loading}
            >
                {#each issueListResource.current.items as issue}
                    <li class="col-span-full grid grid-cols-subgrid">
                        <form
                            method="post"
                            action="?/add_checklist_item"
                            class="contents"
                            use:enhance={(e) => {
                                const ret = onLinkSubmit(issue, e);
                                const old = issueListResource.current;
                                if (old) {
                                    issueListResource.mutate(
                                        paginatedList({
                                            items: old.items.filter((a) => a.id !== issue.id),
                                            totalCount: old.totalCount - 1
                                        })
                                    );
                                }
                                return async (e) => {
                                    if (e.result.type === 'failure') {
                                        issueListResource.current = old;
                                    }
                                    await mapMaybePromise(ret)((a) => {
                                        if (a) {
                                            return a(e);
                                        }
                                    });
                                };
                            }}
                        >
                            <input type="hidden" name="parentIssueId" value={issueId} />
                            <input type="hidden" name="subIssueId" value={issue.id} />
                            <input type="hidden" name="kind" value={ChecklistItemKind.SubIssue} />
                            <Button
                                type="submit"
                                variant="base"
                                filled={false}
                                flat
                                class="group col-span-full grid grid-cols-subgrid items-center gap-4 p-4 text-left font-medium"
                            >
                                <p class="c-text-secondary text-xs">
                                    {issue.project.identifier}-{issue.orderNumber}
                                </p>
                                <p>{issue.title}</p>
                                <IconLink
                                    class="text-primary-1 opacity-0 transition group-hover:opacity-100"
                                />
                            </Button>
                        </form>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>
