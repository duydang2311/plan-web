import { D } from '@mobily/ts-belt';
import { Effect, Exit, pipe } from 'effect';
import type { Issue } from '~/lib/models/issue';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { Workspace } from '~/lib/models/workspace';
import { ApiClient } from '~/lib/services/api_client.server';
import { compareRank } from '~/lib/utils/ranking';
import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { PageServerLoad, PageServerLoadEvent } from './$types';

export const load: PageServerLoad = (e) => {
    switch (e.url.searchParams.get('layout')) {
        case 'board':
            return loadBoardLayout(e);
        default:
            return loadTableLayout(e);
    }
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
    const query = paginatedQuery(
        queryParams(url, {
            page: 1,
            size: 20,
            select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,StatusId,StatusRank',
            order: 'StatusRank'
        })
    );
    const exit = runtime
        .runPromiseExit(
            Effect.gen(function* () {
                const statuses = (yield* getWorkspaceStatuses(data.workspace.id)) ?? [];
                const issueLists = yield* getIssuesForBoard(
                    { ...query, teamId: data.team.id },
                    statuses.map((a) => a.id)
                );
                return { statuses, issueLists };
            })
        )
        .then((a) => (Exit.isFailure(a) ? { statuses: [], issueLists: {} } : a.value));

    return {
        board: isDataRequest ? exit : await exit
    };
};

const loadTableLayout = async ({
    parent,
    url,
    isDataRequest,
    depends,
    locals: { runtime }
}: PageServerLoadEvent) => {
    depends('fetch:issues');
    const data = await parent();
    const query = paginatedQuery(
        queryParams(url, {
            page: 1,
            size: 20,
            select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,StatusId',
            order: 'orderNumber'
        })
    );
    const issueList = runtime
        .runPromiseExit(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get('issues', {
                    query: { ...query, teamId: data.team.id }
                });

                if (!response.ok) {
                    return paginatedList<Issue>();
                }
                return yield* Effect.tryPromise(() => response.json<PaginatedList<Issue>>());
            })
        )
        .then((a) => (Exit.isFailure(a) ? paginatedList<Issue>() : a.value));

    return {
        query,
        issueList: isDataRequest ? issueList : await issueList
    };
};

const getIssuesForBoard = (query: Record<string, unknown>, statusIds: number[]) =>
    Effect.gen(function* () {
        const api = yield* ApiClient;
        const pairs = yield* Effect.all(
            [
                pipe(
                    api.get('issues', {
                        query: { ...query, nullStatusId: true }
                    }),
                    Effect.map((a) => [-1, a] as const)
                ),
                ...statusIds.map((id) =>
                    pipe(
                        api.get('issues', {
                            query: { ...query, statusId: Number(id) }
                        }),
                        Effect.map((a) => [id, a] as const)
                    )
                )
            ],
            { concurrency: 'unbounded' }
        );

        if (pairs.some(([, response]) => !response.ok)) {
            return yield* Effect.fail(pairs);
        }
        return yield* Effect.all(
            pairs.map(([id, response]) =>
                pipe(
                    Effect.tryPromise(() => response.json<PaginatedList<Issue>>()),
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
        const response = yield* api.get(`workspaces/${workspaceId}`, {
            query: { select: 'Statuses' }
        });

        if (!response.ok) {
            return yield* Effect.fail(response);
        }
        return yield* Effect.tryPromise(() => response.json<Workspace>().then((a) => a.statuses));
    });
