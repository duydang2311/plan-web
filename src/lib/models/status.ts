export interface Status {
    id: number;
    order: number;
    value: string;
    color: string;
    icon?: string;
    description?: string;
}

export interface WorkspaceStatus extends Status {
    workspaceId: string;
    isDefault: boolean;
}
