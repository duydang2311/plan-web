import type { ProjectMember, ProjectMemberInvitation } from '~/lib/models/project';
import type { Role } from '~/lib/models/role';
import type { User, UserProfile } from '~/lib/models/user';
import { queryParamsStrict } from '~/lib/utils/url';

export type LocalProjectMember = Pick<ProjectMember, 'createdTime' | 'id'> & {
    role: Pick<Role, 'id' | 'name'>;
    user: Pick<User, 'email'> & { profile?: Pick<UserProfile, 'name' | 'displayName' | 'image'> };
};

export type LocalProjectMemberInvitation = Pick<ProjectMemberInvitation, 'createdTime' | 'id'> & {
    role: Pick<Role, 'name'>;
    user: Pick<User, 'email'> & { profile?: Pick<UserProfile, 'name' | 'displayName' | 'image'> };
};

export const MemberListQuery = {
    params: ({
        url,
        projectId,
        ...rest
    }: { url: URL; projectId: string } & Record<PropertyKey, unknown>) => {
        return {
            ...queryParamsStrict(url, { page: 1, size: 20, order: null }),
            ...rest,
            projectId,
            select: 'CreatedTime,Id,Role.Id,Role.Name,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image'
        } as const;
    },
    key: ({ params }: { params: Record<PropertyKey, unknown> }) => {
        return ['project-members', params] as const;
    }
};

export const InvitationListQuery = {
    params: ({
        url,
        projectId,
        ...rest
    }: { url: URL; projectId: string } & Record<PropertyKey, unknown>) => {
        return {
            ...queryParamsStrict(url, { page: 1, size: 20, order: null }),
            ...rest,
            projectId,
            select: 'CreatedTime,Id,Role.Name,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image'
        } as const;
    },
    key: ({ params }: { params: Record<PropertyKey, unknown> }) => {
        return ['project-member-invitations', params] as const;
    }
};
