import type { User } from './user';

export interface Team {
    createdTime: string;
    updatedTime: string;
    id: string;
    name: string;
    identifier: string;
    members: unknown[];
}

export interface TeamMember {
    createdTime: string;
    updatedTime: string;
    teamId: string;
    memberId: string;
    member: User;
    roleId: number;
    role: TeamRole;
}

export interface TeamRole {
    id: number;
    name: string;
    permisions: TeamRolePermission[];
}

export interface TeamRolePermission {
    roleId: number;
    permission: string;
}

export interface TeamInvitation {
    createdTime: string;
    teamId: string;
    team: Team;
    memberId: string;
    member: User;
}
