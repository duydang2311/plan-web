<script lang="ts">
    import { Pane, PaneGroup, PaneResizer, type PaneAPI } from 'paneforge';
    import { onMount } from 'svelte';
    import { IconButton } from '~/lib/components';
    import {
        IconChevronRight,
        IconPanelRightClose,
        IconPanelRightOpen
    } from '~/lib/components/icons';
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
    let collapsed = $state.raw(false);
    let rightPane = $state.raw<PaneAPI>();
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

<!-- <main class="divide-base-border-2 flex h-full divide-x">
    <div class="relative grow overflow-auto" bind:this={scrollRef} style="contain: strict;">
        <div class="relative flex min-h-full flex-col p-4">
            <div bind:this={issueContainerRef} class="w-full">
                <Issue {form} ref={issueRef} bind:editing />
            </div>
            <hr class="border-base-border-2 -mx-4 my-8 border-dashed" />
            <div class="w-full">
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
    <div class="space-y-8 p-4 max-w-desktop grow">
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
</main> -->

<main class="h-full">
    <PaneGroup direction="horizontal">
        <Pane defaultSize={(3 / 4) * 100}>
            <div class="relative max-h-full flex-1 grow overflow-auto" bind:this={scrollRef}>
                <div class="flex min-h-full flex-col p-4">
                    <div bind:this={issueContainerRef} class="w-full">
                        <Issue {form} ref={issueRef} bind:editing />
                    </div>
                    <hr class="border-base-border-2 -mx-4 my-8 border-dashed" />
                    <div class="w-full">
                        <h2>Activity</h2>
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
        <PaneResizer class="h-full px-1">
            <div class="bg-base-border-2 h-full w-px"></div>
        </PaneResizer>
        <Pane
            defaultSize={(1 / 4) * 100}
            collapsible
            collapsedSize={0}
            bind:pane={rightPane}
            onCollapse={() => (collapsed = true)}
            onExpand={() => (collapsed = false)}
            onResize={(size) => {
                if (Math.abs(size) <= Number.EPSILON) {
                    collapsed = true;
                } else {
                    collapsed = false;
                }
            }}
            class="min-w-max"
        >
            {#if collapsed}
                <div class="p-2 pl-1">
                    <IconButton
                        type="button"
                        variant="base"
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
                <div class="min-w-max space-y-8 p-4">
                    <IconButton
                        type="button"
                        variant="base"
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
                    <div class="-mt-6">
                        <h2 class="text-p mb-2 font-medium">Properties</h2>
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
        </Pane>
    </PaneGroup>
</main>
