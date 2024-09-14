import type { Status } from './status';
import type { Workspace } from './workspace';

export interface Project {
    createdTime: string;
    updatedTime: string;
    workspaceId: string;
    workspace?: Workspace;
    id: string;
    name: string;
    identifier: string;
    description?: string;
    statuses?: ProjectStatus[];
}

export interface ProjectStatus {
    projectId: string;
    project?: string;
    statusId: number;
    status?: Status;
}
