export interface Status {
    id: number;
    rank: number;
    value: string;
    color: string;
    icon?: string;
    description?: string;
    category: StatusCategory;
}

export interface WorkspaceStatus extends Status {
    workspaceId: string;
    isDefault: boolean;
}

export enum StatusCategory {
    Pending = 1,
    Ongoing = 2,
    Completed = 3,
    Canceled = 4
}
