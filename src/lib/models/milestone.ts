import type { Project } from './project';

export interface Milestone {
    createdTime: string;
    updatedTime: string;
    id: string;
    projectId: string;
    endTime: string;
    endTimeZone?: string;
    title: string;
    emoji: string;
    color: string;
    description?: string;
    statusId?: number;
    status?: MilestoneStatus;
}

export interface MilestoneStatus {
    id: string;
    category: MilestoneStatusCategory;
    rank: string;
    value: string;
    color?: string;
    icon?: string;
    description?: string;
    projectId: string;
    project: Project;
    isDefault: boolean;
}

export enum MilestoneStatusCategory {
    Pending = 1,
    Ongoing = 2,
    Completed = 3,
    Canceled = 4,
    Paused = 5
}

