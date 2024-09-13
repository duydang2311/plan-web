export interface Role {
    id: number;
    name: string;
    permissions?: RolePermission[];
}

export interface RolePermission {
    roleId: number;
    permission: string;
}
