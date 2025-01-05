import { createQuery } from '@tanstack/svelte-query';
import { toStore } from 'svelte/store';
import { useRuntime } from '~/lib/contexts/runtime.client';
import type { Metadata } from '~/lib/models/metadata';
import type { PaginatedList } from '~/lib/models/paginatedList';
import { QueryResponse } from '~/lib/utils/query';
import type { LocalIssue } from './+page.server';

export const createProjectQueryParams = () => {
    return { select: 'CreatedTime,Description' };
};

export const createIssueListQueryParams = (deps: () => { projectId: string }) => {
    const { projectId } = deps();
    return { projectId, select: 'CreatedTime,UpdatedTime,Id,Title,Description,OrderNumber' };
};

export const createIssueListQuery = (deps: () => { projectId: string }) => {
    const { api } = useRuntime();
    return createQuery(
        toStore(() => {
            const { projectId } = deps();
            const params = createIssueListQueryParams(() => ({ projectId }));
            return {
                queryKey: ['issues', params],
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get('issues', { query: params })
                    );
                    return await QueryResponse.JSON(() =>
                        response.json<PaginatedList<LocalIssue>>()
                    );
                }
            };
        })
    );
};

export const createTeamMetadataQuery = (deps: () => { projectId: string }) => {
    const { api } = useRuntime();
    return createQuery(
        toStore(() => {
            const params = deps();
            return {
                queryKey: ['project-team-metadata', params],
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get(`projects/${params.projectId}/teams/metadata`)
                    );
                    return await QueryResponse.JSON(() => response.json<Metadata>());
                }
            };
        })
    );
};

export const createMemberMetadataQuery = (deps: () => { projectId: string }) => {
    const { api } = useRuntime();
    return createQuery(
        toStore(() => {
            const params = deps();
            return {
                queryKey: ['project-member-metadata', params],
                queryFn: async () => {
                    const response = await QueryResponse.HTTP(() =>
                        api.get(`projects/${params.projectId}/members/metadata`)
                    );
                    return await QueryResponse.JSON(() => response.json<Metadata>());
                }
            };
        })
    );
};
