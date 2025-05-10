import { createQuery } from '@tanstack/svelte-query';
import { Editor } from '@tiptap/core';
import { toStore } from 'svelte/store';
import { useRuntime } from '~/lib/contexts/runtime.client';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { Team } from '~/lib/models/team';
import type { UserPreset } from '~/lib/models/user';
import { QueryResponse } from '~/lib/utils/query';
import { extend, validator } from '~/lib/utils/validation';

export type LocalIssueAssignee = {
    user: UserPreset['basicProfile'];
};

export type LocalTeam = Pick<Team, 'id' | 'name' | 'identifier'>;

export type LocalTeamIssue = {
    team: LocalTeam;
};

const validateEditor = validator<{ editor: Editor }>((input, { error }) => {
    if (typeof input !== 'object' || !input) {
        return error('root', 'object');
    }
    if (!('editor' in input) || !(input.editor instanceof Editor)) {
        return error('editor', 'Editor');
    }
});

export const clientValidate = extend<{ editor: Editor }, { editor: Editor; issueId: string }>(
    validateEditor,
    (input, { error }) => {
        if (typeof input !== 'object' || !input) {
            return error('root', 'object');
        }
        if (!('issueId' in input) || typeof input.issueId !== 'string') {
            return error('issueId', 'string');
        }

        const i = input as unknown as { editor: Editor };
        if (i.editor.isEmpty) {
            return error('content', 'string');
        }
    }
);

export const createAssigneeListQueryKey = ({ issueId }: { issueId: string }) =>
    ['issues', { issueId: issueId, tag: 'select-assignees' }] as const;

export const createAssigneeListQuery = (f: () => { issueId: string }) => {
    const { api } = useRuntime();
    return createQuery(
        toStore(() => {
            const { issueId } = f();
            return {
                queryKey: createAssigneeListQueryKey({ issueId }),
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get(`issues/${issueId}/assignees`, {
                            query: {
                                select: 'User.Id,User.Email,User.Profile.DisplayName,User.Profile.Image'
                            }
                        })
                    );
                    return await QueryResponse.JSON(() =>
                        response.json<PaginatedList<LocalIssueAssignee>>()
                    );
                }
            };
        })
    );
};

export const createAssignedTeamListQueryKey = ({ issueId }: { issueId: string }) => [
    'issues',
    { issueId, tag: 'select-team' }
];

export const createAssignedTeamListQuery = (f: () => { issueId: string }) => {
    const { api } = useRuntime();
    return createQuery(
        toStore(() => {
            const { issueId } = f();
            return {
                queryKey: createAssignedTeamListQueryKey({ issueId }),
                queryFn: async () => {
                    const response = await api.get(`team-issues`, {
                        query: { issueId, select: 'Team.Id,Team.Name,Team.Identifier' }
                    });
                    if (!response.ok) {
                        return null;
                    }
                    return await response.json<PaginatedList<LocalTeamIssue>>();
                }
            };
        })
    );
};
