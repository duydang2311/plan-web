import { D } from '@mobily/ts-belt';
import { redirect } from '@sveltejs/kit';
import { Effect, Exit, pipe } from 'effect';
import type { Issue } from '~/lib/models/issue';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { Workspace } from '~/lib/models/workspace';
import { ApiClient } from '~/lib/services/api_client.server';
import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { PageServerLoad } from './$types';
import { orderBy } from 'natural-orderby';

export const load: PageServerLoad = async ({
    url,
    params: { path },
    parent,
    depends,
    isDataRequest,
    locals: { runtime }
}) => {
    const data = await parent();

    const query = paginatedQuery(
        queryParams(url, {
            page: 1,
            size: 20,
            select: 'CreatedTime, UpdatedTime, Id, OrderNumber, Title, StatusId, OrderByStatus',
            order: 'orderNumber'
        })
    );

    if (url.searchParams.get('layout') === 'board') {
        depends('fetch:issues-board');
        const exit = runtime
            .runPromiseExit(
                Effect.gen(function* () {
                    const statuses = (yield* getWorkspaceStatuses(data.workspace.id)) ?? [];
                    const issueLists = yield* getIssuesForBoard(
                        { ...query, teamId: data.team.id },
                        statuses.map((a) => a.id + '')
                    );
                    return { statuses, issueLists };
                })
            )
            .then((a) => (Exit.isFailure(a) ? { statuses: [], issueLists: {} } : a.value));

        return {
            board: isDataRequest ? exit : await exit
        };
    }

    const exit = await runtime.runPromiseExit(
        Effect.gen(function* () {
            const api = yield* ApiClient;
            const response = yield* api.get('issues', {
                query: { ...query, teamId: data.team.id }
            });

            if (response.status === 403) {
                return yield* Effect.fail<void>(void 0);
            }
            return response;
        })
    );

    if (Exit.isFailure(exit)) {
        return redirect(302, `/${path}`);
    }

    const list = runtime
        .runPromiseExit(
            Effect.gen(function* () {
                if (!exit.value.ok) {
                    return yield* Effect.succeed(paginatedList<Issue>());
                }
                return yield* Effect.tryPromise(() => exit.value.json<PaginatedList<Issue>>());
            })
        )
        .then((exit) => (Exit.isFailure(exit) ? paginatedList<Issue>() : exit.value))
        .then((v) => ({ ...v, size: query.size, offset: query.offset }));

    if (Exit.isFailure(exit)) {
        return redirect(302, `/${path}`);
    }

    return {
        issueList: isDataRequest ? list : await list,
        query
    };
};

const getIssuesForBoard = (query: Record<string, unknown>, statusIds: string[]) =>
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
                    Effect.tap((a) => {
                        console.log(a.items.map((a) => a.orderByStatus));
                        return Effect.void;
                    }),
                    Effect.map(
                        (a) =>
                            [
                                id,
                                paginatedList({
                                    items: orderBy(
                                        a.items,
                                        [(a) => a.orderByStatus, (a) => a.createdTime],
                                        ['desc', 'desc']
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
            query: { select: 'new(Statuses)' }
        });

        if (!response.ok) {
            return yield* Effect.fail(response);
        }
        return yield* Effect.tryPromise(() => response.json<Workspace>().then((a) => a.statuses));
    });
