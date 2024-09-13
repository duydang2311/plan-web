import type { Role } from './role';
import type { Status } from './status';
import type { User } from './user';

export interface Workspace {
    id: string;
    statuses?: Status[];
}

export interface WorkspaceMember {
    userRoleId: number;
    userId: string;
    user?: User;
    roleId: number;
    role?: Role;
    workspaceId: string;
    workspace?: Workspace;
}
