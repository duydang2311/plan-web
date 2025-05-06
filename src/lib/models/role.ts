export interface Role {
    id: number;
    name: string;
    permissions?: RolePermission[];
    rank: number;
}

export interface RolePermission {
    roleId: number;
    permission: string;
}
