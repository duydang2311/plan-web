import type { ProjectMember } from '~/lib/models/project';
import type { Role } from '~/lib/models/role';
import type { User, UserProfile } from '~/lib/models/user';
import { paginatedQuery, queryParams } from '~/lib/utils/url';

export type LocalProjectMember = Pick<ProjectMember, 'createdTime' | 'userRoleId'> & {
    role: Pick<Role, 'name'>;
    user: Pick<User, 'email'> & { profile?: Pick<UserProfile, 'name' | 'displayName' | 'image'> };
};

export const createProjectMemberListQueryParams = (deps: () => { url: URL; projectId: string }) => {
    const { url, projectId } = deps();
    return {
        ...paginatedQuery(queryParams(url, { page: 1, size: 20 })),
        projectId,
        select: 'CreatedTime,UserRoleId,Role.Name,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image'
    };
};
