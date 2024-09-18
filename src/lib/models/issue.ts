import type { WorkspaceStatus } from './status';

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
    orderByStatus: number;
    priority: IssuePriority;
}

export type IssuePriority = (typeof IssuePriorities)[keyof typeof IssuePriorities];

export const IssuePriorities = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    urgent: 4
} as const;
