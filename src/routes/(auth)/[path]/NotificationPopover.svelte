<script lang="ts">
    import { createInfiniteQuery } from '@tanstack/svelte-query';
    import { DateTime } from 'luxon';
    import type { Popover } from 'melt/components';
    import { toStore } from 'svelte/store';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { QueryResponse } from '~/lib/utils/query';
    import { createLoading } from '~/lib/utils/runes.svelte';
    import { formatRelativeDateUi } from '~/lib/utils/time';
    import { popover as popoverTransition, tsap } from '~/lib/utils/transition';

    type NotificationType = typeof notificationTypes;

    interface LocalUserNotification {
        id: number;
        createdTime: string;
        notification:
            | {
                  type: NotificationType['projectCreated'];
                  data: {
                      identifier: string;
                      name: string;
                      workspace: { path: string };
                  };
              }
            | {
                  type: NotificationType['issueCreated'];
                  data: {
                      orderNumber: number;
                      title: string;
                      project: {
                          identifier: string;
                          workspace: { path: string };
                      };
                  };
              }
            | {
                  type: NotificationType['commentCreated'];
                  data: {
                      issue: {
                          orderNumber: number;
                          title: string;
                          project: {
                              identifier: string;
                              workspace: { path: string };
                          };
                      };
                  };
              }
            | {
                  type: NotificationType['projectMemberInvited'];
                  data: {
                      id: number;
                      project: {
                          identifier: string;
                          name: string;
                      };
                  };
              };
    }

    const { userId, builder }: { userId: string; builder: Popover['popover']['content'] } =
        $props();
    const { api, idHasher } = useRuntime();
    const notificationTypes = {
        none: 0,
        projectCreated: 1,
        issueCreated: 2,
        commentCreated: 3,
        projectMemberInvited: 4
    } as const;
    const loading = createLoading();
    const query = createInfiniteQuery(
        toStore(() => ({
            queryKey: ['user-notifications', { userId }],
            initialPageParam: 0,
            getNextPageParam: (lastPage: { nextOffset: number }) => lastPage.nextOffset,
            queryFn: async ({ pageParam }: { pageParam: number }) => {
                try {
                    loading.set();
                    const response = await QueryResponse.Fetch(() =>
                        api.get(`user-notifications/${userId}`, {
                            query: {
                                offset: pageParam,
                                select: 'Id,CreatedTime,Notification.Type,Notification.Data',
                                selectProject: 'Name,Identifier,Workspace.Path',
                                selectIssue:
                                    'OrderNumber,Title,Project.Identifier,Project.Workspace.Path',
                                selectComment:
                                    'Issue.Title,Issue.OrderNumber,Issue.Project.Identifier,Issue.Project.Workspace.Path',
                                selectProjectMemberInvitation: 'Id,Project.Name,Project.Identifier',
                                sort: '-CreatedTime'
                            }
                        })
                    );
                    const list = await response.json<PaginatedList<LocalUserNotification>>();
                    return {
                        ...list,
                        nextOffset: pageParam + list.items.length
                    };
                } finally {
                    loading.unset();
                }
            },
            staleTime: 1000
        }))
    );
    const grouped = $derived(
        $query.data
            ? $query.data.pages
                  .flatMap((a) => a.items)
                  .reduce<Record<string, LocalUserNotification[]>>((acc, cur) => {
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

<div
    class="w-paragraph-sm -translate-x-2 translate-y-2 bg-transparent lg:-translate-x-4"
    {...builder}
    in:tsap={popoverTransition.in}
    out:tsap={popoverTransition.out}
>
    <div class="c-popover p-0">
        <div class="border-b-base-border-2 relative border-b p-2">
            <h2 class="text-p text-center tracking-tight">Your notifications</h2>
            {#if loading.short}
                <Spinner2
                    class="text-base-fg-ghost absolute left-0 top-1/2 size-5 -translate-y-1/2 translate-x-1/2"
                />
            {/if}
        </div>
        <div
            class="max-h-[calc(100vh-7.5rem)] overflow-auto p-2"
            class:animate-pulse={$query.isFetching}
        >
            {#if $query.isPending}
                {@render skeleton()}
            {:else if grouped == null || Object.values(grouped).length === 0}
                <span class="c-label">No notifications found.</span>
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
                                    <a
                                        href="/{userNotification.notification.data.workspace
                                            .path}/projects/{userNotification.notification.data
                                            .identifier}"
                                        class="bg-base-1 dark:bg-base-3 hover:bg-base-hover text-base-fg-2 block gap-2 rounded-md px-4 py-2 transition"
                                    >
                                        <p class="text-pretty">
                                            New project created —
                                            <strong class="text-base-fg-1">
                                                {userNotification.notification.data.name}
                                            </strong>.
                                        </p>
                                        <p class="c-label">
                                            {DateTime.fromISO(userNotification.createdTime)
                                                .toLocal()
                                                .toLocaleString(DateTime.TIME_SIMPLE)}
                                        </p>
                                    </a>
                                {:else if userNotification.notification.type === notificationTypes.issueCreated}
                                    <a
                                        href="/{userNotification.notification.data.project.workspace
                                            .path}/projects/{userNotification.notification.data
                                            .project.identifier}/issues/{userNotification
                                            .notification.data.orderNumber}"
                                        class="bg-base-1 dark:bg-base-3 hover:bg-base-hover text-base-fg-2 block gap-2 rounded-md px-4 py-2 transition"
                                    >
                                        <p class="text-pretty">
                                            New issue created —
                                            <strong class="text-base-fg-1">
                                                {userNotification.notification.data.title}
                                            </strong>.
                                        </p>
                                        <p class="c-label">
                                            {DateTime.fromISO(userNotification.createdTime)
                                                .toLocal()
                                                .toLocaleString(DateTime.TIME_SIMPLE)}
                                        </p>
                                    </a>
                                {:else if userNotification.notification.type === notificationTypes.commentCreated}
                                    <a
                                        href="/{userNotification.notification.data.issue.project
                                            .workspace.path}/projects/{userNotification.notification
                                            .data.issue.project.identifier}/issues/{userNotification
                                            .notification.data.issue.orderNumber}"
                                        class="bg-base-1 dark:bg-base-3 hover:bg-base-hover text-base-fg-2 block gap-2 rounded-md px-4 py-2 transition"
                                    >
                                        <p class="text-pretty">
                                            New comment added —
                                            <strong class="text-base-fg-1">
                                                {userNotification.notification.data.issue.title}
                                            </strong>.
                                        </p>
                                        <p class="c-label">
                                            {DateTime.fromISO(userNotification.createdTime)
                                                .toLocal()
                                                .toLocaleString(DateTime.TIME_SIMPLE)}
                                        </p>
                                    </a>
                                {:else if userNotification.notification.type === notificationTypes.projectMemberInvited}
                                    <a
                                        href="/project-invites/{idHasher.encode([
                                            userNotification.notification.data.id
                                        ])}"
                                        class="bg-base-1 dark:bg-base-3 hover:bg-base-hover text-base-fg-2 block gap-2 rounded-md px-4 py-2 transition"
                                    >
                                        <p class="text-pretty">
                                            You have been invited a project —
                                            <strong class="text-base-fg-1">
                                                {userNotification.notification.data.project.name}
                                            </strong>.
                                        </p>
                                        <p class="c-label">
                                            {DateTime.fromISO(userNotification.createdTime)
                                                .toLocal()
                                                .toLocaleString(DateTime.TIME_SIMPLE)}
                                        </p>
                                    </a>
                                {/if}
                            </li>
                        {/each}
                    </ol>
                {/each}
            {/if}
        </div>
    </div>
</div>
