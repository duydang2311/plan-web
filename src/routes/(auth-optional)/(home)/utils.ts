import { createQuery } from '@tanstack/svelte-query';
import { toStore } from 'svelte/store';
import { useRuntime } from '~/lib/contexts/runtime.client';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { Team, TeamInvitation } from '~/lib/models/team';
import type { User, UserProfile } from '~/lib/models/user';
import type { Workspace } from '~/lib/models/workspace';
import { QueryResponse } from '~/lib/utils/query';
import { validator } from '~/lib/utils/validation';

export type LocalUser = Pick<User, 'id'> & {
    profile?: Pick<UserProfile, 'name' | 'displayName' | 'image'>;
};
export type LocalWorkspace = Pick<Workspace, 'name' | 'path'>;
export type LocalTeamInvitation = Pick<TeamInvitation, 'id'> & { team: Pick<Team, 'id' | 'name'> };

export const validateAcceptTeamInvite = validator<{ teamInvitationId: string }>(
    (input, { error }) => {
        if (!input || typeof input !== 'object') {
            return error('root', 'object');
        }

        if (
            !('teamInvitationId' in input) ||
            !input.teamInvitationId ||
            typeof input.teamInvitationId !== 'string'
        ) {
            return error('teamInvitationId', 'string');
        }
    }
);

export function decodeAcceptTeamInvite(formData: FormData) {
    return {
        teamInvitationId: formData.get('teamInvitationId')
    };
}

export const validateDeclineTeamInvite = validator<{ teamInvitationId: string }>(
    (input, { error }) => {
        if (!input || typeof input !== 'object') {
            return error('root', 'object');
        }

        if (
            !('teamInvitationId' in input) ||
            !input.teamInvitationId ||
            typeof input.teamInvitationId !== 'string'
        ) {
            return error('teamInvitationId', 'string');
        }
    }
);

export function decodeDeclineTeamInvite(formData: FormData) {
    return {
        teamInvitationId: formData.get('teamInvitationId')
    };
}

export const createWorkspaceListParams = (userId: string) =>
    ({
        userId,
        select: 'Name,Path'
    }) as const;

export const createUserQueryParams = () => {
    return {
        select: 'Id,Profile.Name,Profile.DisplayName,Profile.Image'
    } as const;
};

export const createUserQueryKey = (
    f: () => { userId: string; params: Record<PropertyKey, unknown> }
) => {
    const { userId, params } = f();
    return ['users', { tag: 'home', userId, params }] as const;
};

export const createUserQuery = (f: () => { userId: string }) => {
    const { api } = useRuntime();
    return createQuery(
        toStore(() => {
            const { userId } = f();
            const params = createUserQueryParams();
            return {
                queryKey: createUserQueryKey(() => ({ userId, params })),
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get(`users/${userId}`, { query: params })
                    );
                    return await QueryResponse.JSON(() => response.json<LocalUser>());
                }
            };
        })
    );
};

export const createTeamInvitationListQueryParams = () => {
    return {
        select: 'Id,Team.Id,Team.Name'
    } as const;
};

export const createTeamInvitationListQueryKey = (
    f: () => { userId: string; params: Record<PropertyKey, unknown> }
) => {
    const { userId, params } = f();
    return ['team-invitations', { tag: 'home', userId, params }] as const;
};

export const createTeamInvitationListQuery = (f: () => { userId: string }) => {
    const { api } = useRuntime();
    return createQuery(
        toStore(() => {
            const params = createTeamInvitationListQueryParams();
            const { userId } = f();
            return {
                queryKey: createTeamInvitationListQueryKey(() => ({ userId, params })),
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get(`users/${userId}/team-invitations`, {
                            query: params
                        })
                    );
                    return await QueryResponse.JSON(() =>
                        response.json<PaginatedList<LocalTeamInvitation>>()
                    );
                }
            };
        })
    );
};
