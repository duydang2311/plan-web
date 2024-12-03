import { D } from '@mobily/ts-belt';
import { error } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { Issue } from '~/lib/models/issue';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { WorkspaceStatus } from '~/lib/models/status';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import { compareRank } from '~/lib/utils/ranking';
import type { PageServerLoad, PageServerLoadEvent } from './$types';
import { createBoardQueryParams, createQueryParams } from './utils';

export type LocalIssue = Pick<
    Issue,
    'createdTime' | 'updatedTime' | 'id' | 'orderNumber' | 'title' | 'priority'
> & {
    project: { identifier: string };
    status?: { value: string; rank: string };
};

export type LocalBoardIssue = Pick<
    Issue,
    'createdTime' | 'updatedTime' | 'id' | 'orderNumber' | 'title' | 'statusId' | 'statusRank'
>;

export const load: PageServerLoad = (e) => {
    return e.url.searchParams.get('layout') === 'board' ? loadBoardLayout(e) : loadTableLayout(e);
};

const loadTableLayout = async ({
    url,
    parent,
    isDataRequest,
    locals: { runtime }
}: PageServerLoadEvent) => {
    const data = await parent();
    const query: Record<string, unknown> = createQueryParams(url);
    const teamIdentifier = url.searchParams.get('team');
    const projectIdentifier = url.searchParams.get('project');
    const exitPromise = Effect.gen(function* () {
        if (teamIdentifier) {
            query['teamId'] = yield* fetchTeamIdEffect(data.workspace.id, teamIdentifier);
        }

        if (projectIdentifier) {
            query['projectId'] = yield* fetchProjectIdEffect(data.workspace.id, projectIdentifier);
        }
        const response = yield* LoadResponse.HTTP((yield* ApiClient).get(`issues`, { query }));
        return table({
            issueList: yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalIssue>>()),
            teamId: query['teamId'] as string,
            projectId: query['projectId'] as string
        });
    }).pipe(runtime.runPromiseExit);

    if (isDataRequest) {
        return {
            tag: 'table' as const,
            page: exitPromise.then((a) =>
                Exit.isSuccess(a)
                    ? a.value
                    : table({
                          issueList: paginatedList<LocalIssue>()
                      })
            )
        };
    }

    const exit = await exitPromise;
    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(
            exit.cause,
            Cause.failureOption,
            Option.getOrElse(() => Effect.runSync(LoadResponse.UnknownError()))
        );
        return error(status, body);
    }
    return { tag: 'table' as const, page: exit.value };
};

const loadBoardLayout = async ({
    parent,
    url,
    isDataRequest,
    depends,
    locals: { runtime }
}: PageServerLoadEvent) => {
    depends('fetch:issues-board');
    const data = await parent();
    const query: Record<string, unknown> = createBoardQueryParams(url);
    const teamIdentifier = url.searchParams.get('team');
    const projectIdentifier = url.searchParams.get('project');
    const exitPromise = Effect.gen(function* () {
        if (teamIdentifier) {
            query['teamId'] = yield* fetchTeamIdEffect(data.workspace.id, teamIdentifier);
        }

        if (projectIdentifier) {
            query['projectId'] = yield* fetchProjectIdEffect(data.workspace.id, projectIdentifier);
        }

        const statuses = (yield* getWorkspaceStatuses(data.workspace.id)) ?? [];
        const issueLists = yield* getIssuesForBoard(
            query,
            statuses.map((a) => a.id)
        );
        return board({
            statuses,
            issueLists,
            teamId: query['teamId'] as string,
            projectId: query['projectId'] as string
        });
    }).pipe(runtime.runPromiseExit);

    if (isDataRequest) {
        return {
            tag: 'board' as const,
            page: exitPromise.then((a) =>
                Exit.isSuccess(a)
                    ? a.value
                    : board({
                          statuses: [],
                          issueLists: {}
                      })
            )
        };
    }

    const exit = await exitPromise;
    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(
            exit.cause,
            Cause.failureOption,
            Option.getOrElse(() => Effect.runSync(LoadResponse.UnknownError()))
        );
        return error(status, body);
    }

    return {
        tag: 'board' as const,
        page: exit.value
    };
};

const fetchTeamIdEffect = (workspaceId: string, teamIdentifier: string) => {
    return Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`workspaces/${workspaceId}/teams/identifier/${teamIdentifier}`, {
                query: { select: 'Id' }
            })
        );
        const json = yield* LoadResponse.JSON(() => response.json<{ id: string }>());
        return json.id;
    });
};

const fetchProjectIdEffect = (workspaceId: string, projectIdentifier: string) => {
    return Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(
                `workspaces/${workspaceId}/projects/identifier/${projectIdentifier}`,
                { query: { select: 'Id' } }
            )
        );
        const json = yield* LoadResponse.JSON(() => response.json<{ id: string }>());
        return json.id;
    });
};

const getIssuesForBoard = (query: Record<string, unknown>, statusIds: number[]) =>
    Effect.gen(function* () {
        const api = yield* ApiClient;
        const pairs = yield* Effect.all(
            [
                pipe(
                    LoadResponse.HTTP(
                        api.get('issues', {
                            query: { ...query, nullStatusId: true }
                        })
                    ),
                    Effect.map((a) => [-1, a] as const)
                ),
                ...statusIds.map((id) =>
                    pipe(
                        LoadResponse.HTTP(
                            api.get('issues', {
                                query: { ...query, statusId: Number(id) }
                            })
                        ),
                        Effect.map((a) => [id, a] as const)
                    )
                )
            ],
            { concurrency: 'unbounded' }
        );
        return yield* Effect.all(
            pairs.map(([id, response]) =>
                pipe(
                    LoadResponse.JSON(() => response.json<PaginatedList<LocalBoardIssue>>()),
                    Effect.map(
                        (a) =>
                            [
                                id,
                                paginatedList({
                                    items: a.items.toSorted((a, b) =>
                                        compareRank(a.statusRank, b.statusRank)
                                    ),
                                    totalCount: a.totalCount
                                })
                            ] as const
                    )
                )
            ),
            {
                concurrency: 'unbounded'
            }
        ).pipe(Effect.map((a) => D.fromPairs(a)));
    });

const getWorkspaceStatuses = (workspaceId: string) =>
    Effect.gen(function* () {
        const api = yield* ApiClient;
        const response = yield* LoadResponse.HTTP(
            api.get(`workspaces/${workspaceId}`, {
                query: { select: 'Statuses' }
            })
        );

        return yield* LoadResponse.JSON(() =>
            response.json<{ statuses?: WorkspaceStatus[] }>().then((a) => a.statuses)
        );
    });

const table = (data: {
    issueList: PaginatedList<LocalIssue>;
    teamId?: string;
    projectId?: string;
}) => data;

const board = (data: {
    statuses: WorkspaceStatus[];
    issueLists: Record<string, PaginatedList<LocalBoardIssue>>;
    teamId?: string;
    projectId?: string;
}) => data;
