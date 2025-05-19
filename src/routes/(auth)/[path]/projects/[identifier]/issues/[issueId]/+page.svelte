<script lang="ts">
    import { Pane, PaneGroup, PaneResizer, type PaneAPI } from 'paneforge';
    import { onMount } from 'svelte';
    import { IconButton } from '~/lib/components';
    import { IconPanelRightClose, IconPanelRightOpen } from '~/lib/components/icons';
    import { paginatedList } from '~/lib/models/paginatedList';
    import { permissions } from '~/lib/models/permission';
    import { mapMaybePromise } from '~/lib/utils/promise';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { ActionData, PageData } from './$types';
    import type { LocalChecklistItem } from './+page.server';
    import AddComment from './AddComment.svelte';
    import Audits from './Audits.svelte';
    import Checklist from './Checklist.svelte';
    import DeleteButton from './DeleteButton.svelte';
    import EditButton from './EditButton.svelte';
    import Issue from './Issue.svelte';
    import Priority from './Priority.svelte';
    import SelectAssignees from './SelectAssignees.svelte';
    import SelectTeam from './SelectTeam.svelte';
    import Status from './Status.svelte';
    import Timeline from './Timeline.svelte';

    const { data, form }: { data: PageData; form: ActionData } = $props();
    let editing = $state.raw(false);
    let scrollRef = $state.raw<HTMLElement>();
    const issueRef = createRef(() => data.page.issue);
    const auditListRef = createRef.maybePromise(() => data.page.issueAuditList);
    let issueContainerRef = $state.raw<HTMLElement>();
    let auditsComponent = $state.raw<Audits>();
    let collapsed = $state.raw(false);
    let rightPane = $state.raw<PaneAPI>();
    const checklistRef = createRef.maybePromise(() =>
        mapMaybePromise(data.getChecklist)((a) =>
            a.ok ? a.data : paginatedList<LocalChecklistItem>()
        )
    );
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

<main class="h-full">
    <PaneGroup direction="horizontal">
        <Pane defaultSize={(3 / 4) * 100}>
            <div class="relative max-h-full flex-1 grow overflow-auto" bind:this={scrollRef}>
                <div class="flex min-h-full flex-col p-4 *:py-4 *:first:pt-0 *:last:pb-0">
                    <div bind:this={issueContainerRef}>
                        <Issue {form} ref={issueRef} bind:editing />
                    </div>
                    <div>
                        <Checklist
                            issue={data.page.issue}
                            {checklistRef}
                            projectId={data.project.id}
                            issueId={data.page.issue.id}
                        />
                    </div>
                    <div>
                        <h2 class="text-h4 font-medium">Activity</h2>
                        <div class="mt-4">
                            <Audits
                                ref={auditListRef}
                                issueId={data.page.issue.id}
                                currentUserId={data.page.user.id}
                                scrollRef={scrollRef!}
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
        </Pane>
        <PaneResizer class="h-full min-h-screen px-1">
            <div class="bg-base-border-2 h-full w-px"></div>
        </PaneResizer>
        <Pane
            defaultSize={(1 / 4) * 100}
            collapsible
            bind:pane={rightPane}
            onCollapse={() => (collapsed = true)}
            onExpand={() => (collapsed = false)}
            class="dark:bg-base-1 min-w-8 text-sm"
        >
            <div class="custom-scrollbar h-full max-w-full overflow-auto">
                {#if collapsed}
                    <div class="p-2 pl-1">
                        <IconButton
                            type="button"
                            variant="base"
                            class="text-base"
                            onclick={() => {
                                if (!rightPane) {
                                    return;
                                }
                                if (collapsed) {
                                    rightPane.expand();
                                } else {
                                    rightPane.collapse();
                                }
                            }}
                        >
                            <IconPanelRightOpen />
                        </IconButton>
                    </div>
                {:else}
                    <div class="min-w-72 space-y-8 p-4">
                        <IconButton
                            type="button"
                            variant="base"
                            class="text-base"
                            onclick={() => {
                                if (!rightPane) {
                                    return;
                                }
                                if (collapsed) {
                                    rightPane.expand();
                                } else {
                                    rightPane.collapse();
                                }
                            }}
                        >
                            <IconPanelRightClose />
                        </IconButton>
                        <div class="-mt-6 space-y-4">
                            <div class="flex flex-wrap gap-x-2 gap-y-4 *:grow *:basis-60">
                                <Status
                                    workspaceId={data.workspace.id}
                                    issueId={data.page.issue.id}
                                    canUpdate={can.update}
                                />
                                <Priority
                                    ref={issueRef}
                                    issueId={data.page.issue.id}
                                    canUpdate={can.update}
                                />
                            </div>
                            <Timeline
                                issueId={data.page.issue.id}
                                startTime={data.page.issue.startTime}
                                endTime={data.page.issue.endTime}
                                zone={data.page.issue.timelineZone}
                            />
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
                                <h2 class="text-p mb-2 font-medium">Actions</h2>
                                <div class="items-center gap-2 space-y-2">
                                    {#if can.update}
                                        <EditButton
                                            {editing}
                                            onClick={() => {
                                                editing = !editing;
                                            }}
                                        />
                                    {/if}
                                    {#if can.delete}
                                        <DeleteButton issue={data.page.issue} />
                                    {/if}
                                </div>
                            </div>
                        {/if}
                    </div>
                {/if}
            </div>
        </Pane>
    </PaneGroup>
</main>
