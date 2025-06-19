<script lang="ts">
    import { DateTime } from 'luxon';
    import { IconButton } from '~/lib/components';
    import { IconBellOutline } from '~/lib/components/icons';
    import Popover from '~/lib/components/popover';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { notificationTypeNames, notificationTypes } from '~/lib/models/notification';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import { createRef, watch } from '~/lib/utils/runes.svelte';
    import NotificationPopover from './NotificationPopover.svelte';
    import type { LocalUserNotification } from './utils';

    const { userId }: { userId: string } = $props();
    const { hub } = useRuntime();
    let open = $state.raw(false);
    let unreadCount = $state.raw(0);
    let scrollTop = $state.raw(0);
    const ref = createRef.async<PaginatedList<LocalUserNotification>>();
    const popover = new Popover.Builder({
        open: () => open,
        onOpenChange(value) {
            open = value;
        },
        forceVisible: true,
        floatingConfig: {
            offset: {
                mainAxis: 16
            },
            shift: {
                padding: {
                    right: 16
                }
            }
        }
    });

    type NotificationEvent = {
        UserId: string;
        UserNotificationId: number;
    } & (
        | {
              Type: (typeof notificationTypeNames)[(typeof notificationTypes)['projectCreated']];
              Identifier: string;
              Name: string;
              WorkspacePath: string;
          }
        | {
              Type: (typeof notificationTypeNames)[(typeof notificationTypes)['issueCreated']];
              OrderNumber: number;
              Title: string;
              ProjectIdentifier: string;
              WorkspacePath: string;
          }
        | {
              Type: (typeof notificationTypeNames)[(typeof notificationTypes)['issueCommentCreated']];
              OrderNumber: number;
              Title: string;
              ProjectIdentifier: string;
              WorkspacePath: string;
          }
        | {
              Type: (typeof notificationTypeNames)[(typeof notificationTypes)['projectMemberInvited']];
              ProjectMemberInvitationId: number;
              ProjectIdentifier: string;
              ProjectName: string;
          }
        | {
              Type: (typeof notificationTypeNames)[(typeof notificationTypes)['issueStatusUpdated']];
              OrderNumber: number;
              Title: string;
              ProjectIdentifier: string;
              WorkspacePath: string;
              OldStatusCategory?: number;
              OldStatusColor?: string;
              OldStatusValue?: string;
              NewStatusCategory?: number;
              NewStatusColor?: string;
              NewStatusValue?: string;
          }
    );

    hub.on('new_notification', (data: NotificationEvent) => {
        console.log('new_notification', data);
        if (!open) {
            ++unreadCount;
        }
        switch (data.Type) {
            case notificationTypeNames[notificationTypes.projectCreated]:
                ref.value = {
                    items: [
                        {
                            id: data.UserNotificationId,
                            createdTime: DateTime.now().toISO(),
                            notification: {
                                type: notificationTypes.projectCreated,
                                data: {
                                    name: data.Name,
                                    identifier: data.Identifier,
                                    workspace: { path: data.WorkspacePath }
                                }
                            }
                        },
                        ...(ref.value?.items ?? [])
                    ],
                    totalCount: (ref.value?.totalCount ?? 0) + 1
                };
                break;
            case notificationTypeNames[notificationTypes.issueCreated]:
                ref.value = {
                    items: [
                        {
                            id: data.UserNotificationId,
                            createdTime: DateTime.now().toISO(),
                            notification: {
                                type: notificationTypes.issueCreated,
                                data: {
                                    orderNumber: data.OrderNumber,
                                    project: {
                                        identifier: data.ProjectIdentifier,
                                        workspace: { path: data.WorkspacePath }
                                    },
                                    title: data.Title
                                }
                            }
                        },
                        ...(ref.value?.items ?? [])
                    ],
                    totalCount: (ref.value?.totalCount ?? 0) + 1
                };
                break;
            case notificationTypeNames[notificationTypes.issueCommentCreated]:
                ref.value = {
                    items: [
                        {
                            id: data.UserNotificationId,
                            createdTime: DateTime.now().toISO(),
                            notification: {
                                type: notificationTypes.issueCommentCreated,
                                data: {
                                    issue: {
                                        orderNumber: data.OrderNumber,
                                        project: {
                                            identifier: data.ProjectIdentifier,
                                            workspace: { path: data.WorkspacePath }
                                        },
                                        title: data.Title
                                    }
                                }
                            }
                        },
                        ...(ref.value?.items ?? [])
                    ],
                    totalCount: (ref.value?.totalCount ?? 0) + 1
                };
                break;
            case notificationTypeNames[notificationTypes.projectMemberInvited]:
                ref.value = {
                    items: [
                        {
                            id: data.UserNotificationId,
                            createdTime: DateTime.now().toISO(),
                            notification: {
                                type: notificationTypes.projectMemberInvited,
                                data: {
                                    id: data.ProjectMemberInvitationId,
                                    project: {
                                        identifier: data.ProjectIdentifier,
                                        name: data.ProjectName
                                    }
                                }
                            }
                        },
                        ...(ref.value?.items ?? [])
                    ],
                    totalCount: (ref.value?.totalCount ?? 0) + 1
                };
                break;
            case notificationTypeNames[notificationTypes.issueStatusUpdated]:
                ref.value = {
                    items: [
                        {
                            id: data.UserNotificationId,
                            createdTime: DateTime.now().toISO(),
                            notification: {
                                type: notificationTypes.issueStatusUpdated,
                                data: {
                                    issue: {
                                        orderNumber: data.OrderNumber,
                                        project: {
                                            identifier: data.ProjectIdentifier,
                                            workspace: { path: data.WorkspacePath }
                                        },
                                        title: data.Title
                                    },
                                    oldStatus: data.OldStatusValue
                                        ? {
                                              category: data.OldStatusCategory!,
                                              color: data.OldStatusColor!,
                                              value: data.OldStatusValue
                                          }
                                        : undefined,
                                    newStatus: data.NewStatusValue
                                        ? {
                                              category: data.NewStatusCategory!,
                                              color: data.NewStatusColor!,
                                              value: data.NewStatusValue
                                          }
                                        : undefined
                                }
                            }
                        },
                        ...(ref.value?.items ?? [])
                    ],
                    totalCount: (ref.value?.totalCount ?? 0) + 1
                };
                break;
        }
    });

    watch(() => open)(() => {
        if (open && unreadCount > 0) {
            unreadCount = 0;
        }
    });
</script>

<IconButton
    type="button"
    variant={unreadCount === 0 ? 'base' : 'info'}
    {...popover.trigger}
    data-custom-state={open ? 'open' : 'closed'}
    class="relative"
    style={unreadCount > 0 ? '--_bg: color-mix(in oklch, var(--color-info-1) 10%, transparent)' : undefined}
>
    <IconBellOutline />
    {#if unreadCount > 0}
        <div
            class="text-info-1 pointer-events-none absolute right-0 top-1/2 h-auto w-4 min-w-max translate-x-1/2 -translate-y-full content-center text-xs font-bold leading-none"
        >
            +{unreadCount}
        </div>
    {/if}
</IconButton>
{#if popover.open}
    <Popover {...popover.content} class="w-paragraph-sm p-0">
        <NotificationPopover {userId} {ref} bind:scrollTop />
    </Popover>
{/if}
