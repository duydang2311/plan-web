export interface Status {
    id: number;
    rank: number;
    value: string;
    color: string;
    icon?: string;
    description?: string;
}

export interface WorkspaceStatus extends Status {
    workspaceId: string;
    isDefault: boolean;
}
