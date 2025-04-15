export const notificationTypes = {
    none: 0,
    projectCreated: 1,
    issueCreated: 2,
    commentCreated: 3,
    projectMemberInvited: 4
} as const;

export const notificationTypeNames = {
    0: 'None',
    1: 'ProjectCreated',
    2: 'IssueCreated',
    3: 'IssueCommentCreated',
    4: 'ProjectMemberInvited',
} as const;

export type NotificationType = typeof notificationTypes;
export type NotificationTypeName = typeof notificationTypeNames;