export const permissions = {
    read: 'read',

    readTeam: 'team:read',
    createTeam: 'team:create',

    createIssue: 'issue:create',
    readIssue: 'issue:read',
    updateIssue: 'issue:update',
    deleteIssue: 'issue:delete',
    commentIssue: 'issue:comment',

    readIssueComment: 'issue-comment:read',
    deleteIssueComment: 'issue-comment:delete',

    updateTeamRole: 'team-role:update',

    createTeamMember: 'team-member:create',
    readTeamMember: 'team-member:read',

    readTeamInvitation: 'team-invitation:read',

    createProject: 'project:create',
    readProject: 'project:read',
    deleteProject: 'project:delete',

    readWorkspaceStatus: 'workspace-status:read',
    createWorkspaceStatus: 'workspace-status:create',
    deleteWorkspaceStatus: 'workspace-status:delete',
    updateWorkspaceStatus: 'workspace-status:update',

    readWorkspaceMember: 'workspace-member:read',
    deleteWorkspaceMember: 'workspace-member:delete',

    readIssueAudit: 'issue-audit:read',
    deleteIssueAudit: 'issue-audit:delete',
    createIssueAuditComment: 'issue-audit-comment:create',

    readProjectMember: 'project-member:read',
    deleteProjectMember: 'project-member:delete',
    createProjectMember: 'project-member:create',
    updateProjectMember: 'project-member:update',

    readProjectMemberInvitation: 'project-member-invitation:read',
    deleteProjectMemberInvitation: 'project-member-invitation:delete',
    createProjectMemberInvitation: 'project-member-invitation:create'
} as const;
