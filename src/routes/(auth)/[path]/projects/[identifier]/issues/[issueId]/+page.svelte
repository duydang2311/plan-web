<script lang="ts">
    import { page } from '$app/state';
    import { paginatedQuery, queryParams } from '~/lib/utils/url';
    import type { ActionData, PageData } from './$types';
    import AddComment from './AddComment.svelte';
    import Comments from './Comments.svelte';
    import DeleteButton from './DeleteButton.svelte';
    import EditButton from './EditButton.svelte';
    import Issue from './Issue.svelte';
    import Priority from './Priority.svelte';
    import Status from './Status.svelte';
    import SelectTeam from './SelectTeam.svelte';
    import SelectAssignees from './SelectAssignees.svelte';
    import Audits from './Audits.svelte';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    const commentQuery = paginatedQuery(queryParams(page.url, { offset: 0, size: 10 }));
    let editing = $state.raw(false);
    let scrollRef = $state.raw<HTMLElement>();
</script>

<main class="flex items-stretch h-full divide-x divide-base-border-2 overflow-hidden">
    <div class="grow relative h-full overflow-auto" bind:this={scrollRef} style="contain: strict;">
        <div class="flex flex-col min-h-full relative p-4">
            <div class="max-w-paragraph-lg w-full mx-auto">
                <Issue
                    {form}
                    {editing}
                    issueId={data.page.issue.id}
                    onCancel={() => {
                        editing = false;
                    }}
                    onSubmit={() => {
                        editing = false;
                    }}
                />
            </div>
            <hr class="my-8 -mx-4" />
            <div class="max-w-paragraph-lg w-full mx-auto">
                <h2>Activity</h2>
                <div class="mt-4">
                    <Audits issueId={data.page.issue.id} />
                </div>
                <div class="mt-2">
                    <Comments
                        authorId={data.page.user.id}
                        issueId={data.page.issue.id}
                        size={commentQuery.size}
                        {scrollRef}
                    />
                </div>
                <div class="mt-8">
                    <AddComment
                        userId={data.page.user.id}
                        issueId={data.page.issue.id}
                        size={commentQuery.size}
                    />
                </div>
            </div>
        </div>
    </div>
    <div class="hidden xl:block w-full max-w-60 p-4 h-full space-y-8">
        <div>
            <h2 class="c-label mb-1">Properties</h2>
            <div class="space-y-2">
                <Status workspaceId={data.workspace.id} issueId={data.page.issue.id} />
                <Priority issueId={data.page.issue.id} />
            </div>
        </div>
        <SelectAssignees workspaceId={data.workspace.id} issueId={data.page.issue.id} />
        <SelectTeam workspaceId={data.workspace.id} issueId={data.page.issue.id} />
        <div>
            <h2 class="c-label mb-1">Actions</h2>
            <div class="space-y-2 gap-2 items-center">
                <EditButton
                    {editing}
                    onClick={() => {
                        editing = !editing;
                    }}
                />
                <DeleteButton issue={data.page.issue} />
            </div>
        </div>
    </div>
</main>
