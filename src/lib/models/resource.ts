import type { User } from './user';
import type { Workspace } from './workspace';

export interface Resource {
    createdTime: string;
    updatedTime: string;
    id: string;
    name: string;
    creatorId: string;
    creator: User;
    rank: string;
    document?: ResourceDocument;
    files?: ResourceFile[];
}

export interface ResourceDocument {
    content: string;
}

export interface ResourceFile {
    createdTime: string;
    updatedTime: string;
    id: string;
    key: string;
    originalName: string;
    size: number;
    mimeType: string;
}

export interface WorkspaceResource {
    workspaceId: string;
    workspace: Workspace;
    resourceId: string;
    resource: Resource;
}

export interface ProjectResource {
    projectId: string;
    project: Workspace;
    resourceId: string;
    resource: Resource;
}
