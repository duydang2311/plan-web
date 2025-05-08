import { createInfiniteQuery, createQuery } from '@tanstack/svelte-query';
import { toStore } from 'svelte/store';
import { useRuntime } from '~/lib/contexts/runtime.client';
import { HttpError } from '~/lib/models/errors';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { WorkspaceStatus } from '~/lib/models/status';
import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';
import type { LocalBoardIssue } from '../+page.server';
import { createBoardQueryParams } from '../utils';

export function toDraggableIssueData(issue: LocalBoardIssue) {
    return {
        type: 'issue',
        id: issue.id,
        statusId: issue.statusId ?? -1,
        statusRank: issue.statusRank,
        title: issue.title,
        orderNumber: issue.orderNumber,
        previewDescription: issue.previewDescription
    };
}

export const validateDraggableIssueData = validator(
    Type.Object({
        type: Type.Literal('issue'),
        id: Type.String(),
        statusId: Type.Optional(Type.Union([Type.Null(), Type.Number()])),
        statusRank: Type.String()
    })
);

export const createStatusListQueryKey = (depsFn: () => { workspaceId: string }) => {
    const deps = depsFn();
    return ['workspace-statuses', { tag: 'issues-board', workspaceId: deps.workspaceId }];
};

export const createStatusListQuery = (depsFn: () => { workspaceId: string }) => {
    const { api } = useRuntime();
    return createQuery(
        toStore(() => {
            const deps = depsFn();
            return {
                queryKey: createStatusListQueryKey(depsFn),
                queryFn: async () => {
                    const response = await api.get(`workspaces/${deps.workspaceId}/statuses`, {
                        query: { select: 'Id,Value,Color,Category' }
                    });
                    if (!response.ok) {
                        return null;
                    }
                    const json = await response.json<PaginatedList<Pick<WorkspaceStatus, 'id'>>>();
                    return {
                        items: [{ id: -1, value: 'No status' }, ...json.items],
                        totalCount: json.totalCount + 1
                    } as PaginatedList<Pick<WorkspaceStatus, 'id' | 'value' | 'color'>>;
                }
            };
        })
    );
};

export const createIssueListQueryKey = (
    depsFn: () => { params: Record<string, unknown>; projectId: string; statusId: number }
) => {
    const { params, projectId, statusId } = depsFn();
    return [
        'issues',
        {
            tag: 'issues-board',
            projectId,
            statusId: statusId === -1 ? null : statusId,
            nullStatusId: statusId === -1,
            params
        }
    ] as const;
};

export const createIssueListInfiniteQuery = (
    depsFn: () => {
        url: URL;
        projectId: string;
        statusId: number;
    }
) => {
    const { api } = useRuntime();
    return createInfiniteQuery<PaginatedList<LocalBoardIssue> & { nextOffset?: number }, HttpError>(
        toStore(() => {
            const deps = depsFn();
            const params = createBoardQueryParams(deps.url);
            return {
                queryKey: createIssueListQueryKey(() => ({
                    params,
                    projectId: deps.projectId,
                    statusId: deps.statusId
                })),
                queryFn: async () => {
                    const response = await api
                        .get('issues', {
                            query: {
                                ...params,
                                projectId: deps.projectId,
                                statusId: deps.statusId === -1 ? undefined : deps.statusId,
                                nullStatusId: deps.statusId === -1
                            }
                        })
                        .catch((e) => {
                            throw new HttpError({
                                status: 400,
                                message: `There was an unknown fetch error while retrieving issue list.\n${e}`
                            });
                        });

                    if (!response.ok) {
                        throw HttpError.from(response);
                    }

                    const list = await response.json<PaginatedList<LocalBoardIssue>>();
                    return {
                        ...list,
                        nextOffset: list.items.length === 0 ? undefined : list.items.length + 1
                    };
                },
                initialPageParam: 0,
                getNextPageParam: (lastPage) => lastPage?.nextOffset
            };
        })
    );
};
