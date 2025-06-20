<script lang="ts">
    import { DateTime } from 'luxon';
    import {
        IssueCommentCreatedNotification,
        IssueCreatedNotification,
        IssueStatusUpdatedNotification,
        ProjectCreatedNotification,
        ProjectMemberInvitedNotification,
        WorkspaceMemberInvitedNotification
    } from '~/lib/components';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { notificationTypes } from '~/lib/models/notification';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { createLoading, watch, type AsyncRef } from '~/lib/utils/runes.svelte';
    import { formatRelativeDateUi } from '~/lib/utils/time';
    import { attempt } from '~/lib/utils/try';
    import type { LocalUserNotification } from './utils';

    let {
        userId,
        ref,
        scrollTop = $bindable(0)
    }: {
        userId: string;
        ref: AsyncRef<PaginatedList<LocalUserNotification> | undefined>;
        scrollTop?: number;
    } = $props();
    const { api } = useRuntime();
    const loading = createLoading();
    const loadMore = async () => {
        loading.set();
        const cursor = ref.value?.items.at(-1)?.id;
        const getAttempt = await attempt.promise(() =>
            api.get(`user-notifications/${userId}`, {
                query: {
                    cursor,
                    select: 'Id,NotificationId,UserId,CreatedTime,Notification.Id,Notification.Type,Notification.Data',
                    selectProject: 'Id,Name,Identifier,Workspace.Path',
                    selectIssue: 'Id,OrderNumber,Title,Project.Identifier,Project.Workspace.Path',
                    selectComment:
                        'Id,Issue.Title,Issue.OrderNumber,Issue.Project.Identifier,Issue.Project.Workspace.Path',
                    selectProjectMemberInvitation: 'Id,Project.Name,Project.Identifier',
                    selectWorkspaceInvitation: 'Id,Workspace.Name',
                    selectStatus: 'Id,Color,Category,Value',
                    order: '-Id,-CreatedTime'
                }
            })
        )();
        if (!getAttempt.ok || !getAttempt.data.ok) {
            loading.unset();
            return;
        }

        const jsonAttempt = await attempt.promise(() =>
            getAttempt.data.json<PaginatedList<LocalUserNotification>>()
        )();
        if (!jsonAttempt.ok) {
            loading.unset();
            return;
        }

        ref.value = {
            items: [...(ref.value?.items ?? []), ...jsonAttempt.data.items],
            totalCount: jsonAttempt.data.totalCount
        };
        loading.unset();
    };
    const grouped = $derived(
        ref.value
            ? ref.value.items.reduce<Record<string, LocalUserNotification[]>>((acc, cur) => {
                  const dateTime = DateTime.fromISO(cur.createdTime);
                  const format = dateTime.toISODate()!;
                  if (acc[format]) {
                      acc[format].push(cur);
                  } else {
                      acc[format] = [cur];
                  }
                  return acc;
              }, {})
            : {}
    );

    let scrollEl = $state.raw<HTMLElement>();
    let loadMoreEl = $state.raw<HTMLElement>();

    if (ref.value == null && !ref.loading.immediate) {
        loadMore();
    }

    watch(() => [loadMoreEl, scrollEl])(() => {
        if (!loadMoreEl || !scrollEl) {
            return;
        }
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries.some((a) => a.target === loadMoreEl && a.isIntersecting) &&
                    !ref.loading.immediate
                ) {
                    loadMore();
                }
            },
            {
                root: scrollEl,
                rootMargin: '0px 0px 200px 0px',
                threshold: 0
            }
        );
        observer.observe(loadMoreEl);
        return () => {
            observer.disconnect();
        };
    });

    watch(() => scrollEl)(() => {
        const el = scrollEl;
        if (!el) {
            return;
        }
        requestAnimationFrame(() => {
            el.scrollTop = scrollTop;
        });
    });
</script>

{#snippet skeleton()}
    <div class="animate-pulse">
        <div class="mb-4 flex items-center gap-2">
            <div class="bg-base-4 h-6 w-32 rounded"></div>
            <div class="bg-base-border-3 h-px grow rounded"></div>
        </div>
        {#each { length: 3 } as _}
            <div class="bg-base-4 mb-2 h-6 w-full rounded"></div>
            <div class="bg-base-4 mb-2 h-6 w-full rounded"></div>
            <div class="bg-base-4 mb-2 h-5 w-8 rounded"></div>
        {/each}
    </div>
{/snippet}

<div class="border-b-base-border-2 relative border-b p-2">
    <h2 class="text-p font-h-bold text-center">Notifications</h2>
    {#if loading.short}
        <Spinner2
            class="text-base-fg-ghost absolute left-0 top-1/2 size-5 -translate-y-1/2 translate-x-1/2"
        />
    {/if}
</div>
<div
    class="max-h-[calc(100vh-7.5rem)] overflow-auto p-2"
    class:animate-pulse={ref.loading.immediate}
    bind:this={scrollEl}
    onscrollend={(e) => {
        scrollTop = e.currentTarget.scrollTop;
    }}
>
    {#if ref.value == null && ref.loading.immediate}
        {@render skeleton()}
    {:else if grouped == null || Object.values(grouped).length === 0}
        <span class="c-text-secondary">No notifications found.</span>
    {:else}
        {#each Object.entries(grouped).filter( (a) => a[1].filter((b) => b.notification.data != null) ) as [isoDate, userNotifications] (isoDate)}
            <div class="flex items-center gap-2">
                <h3 class="text-p text-base-fg-5 my-2 text-center tracking-tight">
                    {formatRelativeDateUi(
                        DateTime.fromFormat(isoDate, 'yyyy-MM-dd', {
                            zone: 'utc'
                        })
                    )}
                </h3>
                <div class="bg-base-border-3 h-px grow"></div>
            </div>
            <ol class="space-y-1">
                {#each userNotifications as userNotification (userNotification.id)}
                    <li>
                        {#if userNotification.notification.type === notificationTypes.projectCreated}
                            <ProjectCreatedNotification
                                workspacePath={userNotification.notification.data.workspace.path}
                                projectIdentifier={userNotification.notification.data.identifier}
                                projectName={userNotification.notification.data.name}
                                createdTime={userNotification.createdTime}
                            />
                        {:else if userNotification.notification.type === notificationTypes.issueCreated}
                            <IssueCreatedNotification
                                workspacePath={userNotification.notification.data.project.workspace
                                    .path}
                                projectIdentifier={userNotification.notification.data.project
                                    .identifier}
                                issueOrderNumber={userNotification.notification.data.orderNumber}
                                issueTitle={userNotification.notification.data.title}
                                createdTime={userNotification.createdTime}
                            />
                        {:else if userNotification.notification.type === notificationTypes.issueCommentCreated}
                            <IssueCommentCreatedNotification
                                issueTitle={userNotification.notification.data.issue.title}
                                issueOrderNumber={userNotification.notification.data.issue
                                    .orderNumber}
                                projectIdentifier={userNotification.notification.data.issue.project
                                    .identifier}
                                workspacePath={userNotification.notification.data.issue.project
                                    .workspace.path}
                                createdTime={userNotification.createdTime}
                            />
                        {:else if userNotification.notification.type === notificationTypes.projectMemberInvited}
                            <ProjectMemberInvitedNotification
                                id={userNotification.notification.data.id}
                                projectName={userNotification.notification.data.project.name}
                                createdTime={userNotification.createdTime}
                            />
                        {:else if userNotification.notification.type === notificationTypes.workspaceMemberInvited}
                            <WorkspaceMemberInvitedNotification
                                id={userNotification.notification.data.id}
                                workspaceName={userNotification.notification.data.workspace.name}
                                createdTime={userNotification.createdTime}
                            />
                        {:else if userNotification.notification.type === notificationTypes.issueStatusUpdated}
                            <IssueStatusUpdatedNotification
                                workspacePath={userNotification.notification.data.issue.project
                                    .workspace.path}
                                projectIdentifier={userNotification.notification.data.issue.project
                                    .identifier}
                                issueOrderNumber={userNotification.notification.data.issue
                                    .orderNumber}
                                issueTitle={userNotification.notification.data.issue.title}
                                oldStatus={userNotification.notification.data.oldStatus}
                                newStatus={userNotification.notification.data.newStatus}
                                createdTime={userNotification.createdTime}
                            />
                        {/if}
                    </li>
                {/each}
                <li class="hidden"></li>
            </ol>
            <div bind:this={loadMoreEl}></div>
        {/each}
    {/if}
</div>
