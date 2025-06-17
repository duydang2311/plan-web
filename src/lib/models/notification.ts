export const notificationTypes = {
    none: 0,
    projectCreated: 1,
    issueCreated: 2,
    issueCommentCreated: 3,
    projectMemberInvited: 4,
    workspaceMemberInvited: 5,
    issueStatusUpdated: 6
} as const;

export const notificationTypeNames = {
    0: 'None',
    1: 'ProjectCreated',
    2: 'IssueCreated',
    3: 'IssueCommentCreated',
    4: 'ProjectMemberInvited',
    5: 'WorkspaceMemberInvited',
    6: 'IssueStatusUpdated'
} as const;

export type NotificationType = (typeof notificationTypes)[keyof typeof notificationTypes];
export type NotificationTypeName =
    (typeof notificationTypeNames)[keyof typeof notificationTypeNames];
