import type { WorkspaceStatus } from './status';
import type { User } from './user';

export interface Issue {
    createdTime: string;
    updatedTime: string;
    id: string;
    authorId: string;
    orderNumber: number;
    title: string;
    description?: string;
    statusId?: number;
    status?: WorkspaceStatus;
    statusRank: string;
    priority: IssuePriority;
    assignees: User[];
}

export type IssuePriority = (typeof IssuePriorities)[keyof typeof IssuePriorities];

export type IssueAuditAction = (typeof IssueAuditActions)[keyof typeof IssueAuditActions];

export interface IssueAudit {
    createdTime: string;
    id: number;
    issueId: string;
    issue: Issue;
    userId: string;
    user: User;
    action: IssueAuditAction;
    data?: unknown;
}

export const IssueAuditActions = {
    none: 0,
    create: 1
} as const;

export const IssuePriorities = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4
} as const;

export function getPriorityLabel(priority: IssuePriority) {
    switch (priority) {
        case IssuePriorities.none:
            return 'No priority';
        case IssuePriorities.low:
            return 'Low';
        case IssuePriorities.medium:
            return 'Medium';
        case IssuePriorities.high:
            return 'High';
        case IssuePriorities.urgent:
            return 'Urgent';
    }
}

export function getPriorityIcon(priority: IssuePriority) {
    switch (priority) {
        case IssuePriorities.none:
            return 'priority-none';
        case IssuePriorities.low:
            return 'priority-low';
        case IssuePriorities.medium:
            return 'priority-medium';
        case IssuePriorities.high:
            return 'priority-high';
        case IssuePriorities.urgent:
            return 'priority-urgent';
    }
}
