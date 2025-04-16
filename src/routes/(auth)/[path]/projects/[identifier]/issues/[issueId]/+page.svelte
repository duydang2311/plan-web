<script lang="ts">
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { ActionData, PageData } from './$types';
    import AddComment from './AddComment.svelte';
    import Audits from './Audits.svelte';
    import DeleteButton from './DeleteButton.svelte';
    import EditButton from './EditButton.svelte';
    import Issue from './Issue.svelte';
    import Priority from './Priority.svelte';
    import SelectAssignees from './SelectAssignees.svelte';
    import SelectTeam from './SelectTeam.svelte';
    import Status from './Status.svelte';
    import { onMount } from 'svelte';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    let editing = $state.raw(false);
    let scrollRef = $state.raw<HTMLElement>();
    const issueRef = createRef(() => data.page.issue);
    const auditListRef = createRef.maybePromise(() => data.page.issueAuditList);
    let issueContainerRef = $state.raw<HTMLElement>();
    let auditsComponent = $state.raw<Audits>();

    onMount(() => {
        const resizeObserver = new ResizeObserver(() => {
            auditsComponent?.invalidateScrollOffset();
        });
        if (issueContainerRef) {
            resizeObserver.observe(issueContainerRef);
        }
        return () => {
            resizeObserver.disconnect();
        };
    });
</script>

<main class="divide-base-border-2 flex h-full items-stretch divide-x divide-dashed overflow-hidden">
    <div class="relative h-full grow overflow-auto" bind:this={scrollRef} style="contain: strict;">
        <div class="relative flex min-h-full flex-col p-4">
            <div bind:this={issueContainerRef} class="max-w-paragraph-lg mx-auto w-full">
                <Issue
                    {form}
                    ref={issueRef}
                    bind:editing
                />
            </div>
            <hr class="border-base-border-2 -mx-4 my-8 border-dashed" />
            <div class="max-w-paragraph-lg mx-auto w-full">
                <h2>Activity</h2>
                <div class="mt-4">
                    <Audits
                        ref={auditListRef}
                        issueId={data.page.issue.id}
                        currentUserId={data.page.user.id}
                        {scrollRef}
                        bind:this={auditsComponent}
                    />
                </div>
                <div class="mt-8">
                    <AddComment
                        user={data.page.user}
                        issueId={data.page.issue.id}
                        ref={auditListRef}
                    />
                </div>
            </div>
        </div>
    </div>
    <div class="hidden h-full w-full max-w-60 space-y-8 p-4 xl:block">
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
            <div class="items-center gap-2 space-y-2">
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
