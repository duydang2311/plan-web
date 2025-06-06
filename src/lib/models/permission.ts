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

    createWorkspaceMember: 'workspace-member:create',
    readWorkspaceMember: 'workspace-member:read',
    deleteWorkspaceMember: 'workspace-member:delete',
    updateWorkspaceMember: 'workspace-member:update',

    readIssueAudit: 'issue-audit:read',
    deleteIssueAudit: 'issue-audit:delete',
    createIssueAuditComment: 'issue-audit-comment:create',

    readProjectMember: 'project-member:read',
    deleteProjectMember: 'project-member:delete',
    createProjectMember: 'project-member:create',
    updateProjectMember: 'project-member:update',

    readProjectMemberInvitation: 'project-member-invitation:read',
    deleteProjectMemberInvitation: 'project-member-invitation:delete',
    createProjectMemberInvitation: 'project-member-invitation:create',

    createWorkspaceResource: 'workspace-resource:create',
    readWorkspaceResource: 'workspace-resource:read',
    updateWorkspaceResource: 'workspace-resource:update',
    deleteWorkspaceResource: 'workspace-resource:delete',

    createWorkspaceResourceFile: 'workspace-resource-file:create',
    readWorkspaceResourceFile: 'workspace-resource-file:read',
    updateWorkspaceResourceFile: 'workspace-resource-file:update',
    deleteWorkspaceResourceFile: 'workspace-resource-file:delete',

    createWorkspaceInvitation: 'workspace-invitation:create',
    readWorkspaceInvitation: 'workspace-invitation:read',
    updateWorkspaceInvitation: 'workspace-invitation:update',
    deleteWorkspaceInvitation: 'workspace-invitation:delete',

    createIssueAssignee: 'issue-assignee:create',
    readIssueAssignee: 'issue-assignee:read',
    updateIssueAssignee: 'issue-assignee:update',
    deleteIssueAssignee: 'issue-assignee:delete',

    createTeamIssue: 'team-issue:create',
    readTeamIssue: 'team-issue:read',
    updateTeamIssue: 'team-issue:update',
    deleteTeamIssue: 'team-issue:delete',

    createChecklistItem: 'checklist-items:create',
    readChecklistItem: 'checklist-items:read',
    updateChecklistItem: 'checklist-items:update',
    deleteChecklistItem: 'checklist-items:delete',

    createMilestone: 'milestone:create',
    readMilestone: 'milestone:read',
    updateMilestone: 'milestone:update',
    deleteMilestone: 'milestone:delete',

    createMilestoneStatus: 'milestone-status:create',
    readMilestoneStatus: 'milestone-status:read',
    updateMilestoneStatus: 'milestone-status:update',
    deleteMilestoneStatus: 'milestone-status:delete'
} as const;
