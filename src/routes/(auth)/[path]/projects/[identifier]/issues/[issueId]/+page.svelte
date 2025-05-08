<script lang="ts">
    import { onMount } from 'svelte';
    import { permissions } from '~/lib/models/permission';
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

    const { data, form }: { data: PageData; form: ActionData } = $props();
    let editing = $state.raw(false);
    let scrollRef = $state.raw<HTMLElement>();
    const issueRef = createRef(() => data.page.issue);
    const auditListRef = createRef.maybePromise(() => data.page.issueAuditList);
    let issueContainerRef = $state.raw<HTMLElement>();
    let auditsComponent = $state.raw<Audits>();
    const getProjectPermissionsRef = createRef.maybePromise(() => data.getProjectPermissions);
    const can = $derived({
        update:
            issueRef.value?.authorId === data.user.id ||
            (getProjectPermissionsRef.value?.has(permissions.updateIssue) ?? false),
        delete:
            issueRef.value?.authorId === data.user.id ||
            (getProjectPermissionsRef.value?.has(permissions.deleteIssue) ?? false),
        comment:
            issueRef.value?.authorId === data.user.id ||
            (getProjectPermissionsRef.value?.has(permissions.commentIssue) ?? false),
        assignUser:
            issueRef.value?.authorId === data.user.id ||
            (getProjectPermissionsRef.value?.has(permissions.createIssueAssignee) ?? false),
        assignTeam:
            issueRef.value?.authorId === data.user.id ||
            (getProjectPermissionsRef.value?.has(permissions.createTeamIssue) ?? false)
    });

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
                <Issue {form} ref={issueRef} bind:editing />
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
                {#if can.comment}
                    <div class="mt-8">
                        <AddComment
                            user={data.page.user}
                            issueId={data.page.issue.id}
                            ref={auditListRef}
                        />
                    </div>
                {/if}
            </div>
        </div>
    </div>
    <div class="hidden h-full w-full max-w-60 space-y-8 p-4 xl:block">
        <div>
            <h2 class="c-label mb-1">Properties</h2>
            <div class="space-y-2">
                <Status
                    workspaceId={data.workspace.id}
                    issueId={data.page.issue.id}
                    canUpdate={can.update}
                />
                <Priority issueId={data.page.issue.id} canUpdate={can.update} />
            </div>
        </div>
        <SelectAssignees
            workspaceId={data.workspace.id}
            issueId={data.page.issue.id}
            canAssign={can.assignUser}
        />
        <SelectTeam
            workspaceId={data.workspace.id}
            issueId={data.page.issue.id}
            canAssign={can.assignTeam}
        />
        {#if can.update || can.delete}
            <div>
                <h2 class="c-label mb-1">Actions</h2>
                {#if can.update}
                    <div class="items-center gap-2 space-y-2">
                        <EditButton
                            {editing}
                            onClick={() => {
                                editing = !editing;
                            }}
                        />
                    </div>
                {/if}
                {#if can.delete}
                    <DeleteButton issue={data.page.issue} />
                {/if}
            </div>
        {/if}
    </div>
</main>
