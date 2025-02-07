import type { Role } from './role';
import type { Status } from './status';
import type { User } from './user';
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

export interface ProjectMember {
    createdTime: string;
    id: number;
    roleId: number;
    role: Role;
    userId: string;
    user: User;
}

export interface ProjectMemberInvitation {
    createdTime: string;
    id: number;
    userId: string;
    user: User;
    projectId: string;
    project: Project;
    roleId: number;
    role: Role;
}
