import { D } from '@mobily/ts-belt';
import { Console, Effect, Exit, pipe } from 'effect';
import type { Issue } from '~/lib/models/issue';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { WorkspaceStatus } from '~/lib/models/status';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import type { PageServerLoad, PageServerLoadEvent } from './$types';
import { createBoardQueryParams, createIssueListQueryParams } from './utils';
import type { UserPreset } from '~/lib/models/user';

export type LocalIssue = Pick<
    Issue,
    'createdTime' | 'updatedTime' | 'id' | 'orderNumber' | 'title' | 'priority'
> & {
    project: { identifier: string };
    status?: { value: string; rank: string };
};

export type LocalBoardIssue = Pick<
    Issue,
    | 'createdTime'
    | 'updatedTime'
    | 'id'
    | 'orderNumber'
    | 'title'
    | 'statusId'
    | 'statusRank'
    | 'priority'
> & { author: UserPreset['email'] & UserPreset['profile'] };

export type LocalWorkspaceStatus = Pick<WorkspaceStatus, 'id' | 'value' | 'color' | 'category'>;

export interface PageBoardData {
    statuses: PaginatedList<LocalWorkspaceStatus>;
    issueLists: Record<string, PaginatedList<LocalBoardIssue>>;
    project: { identifier: string };
}

export const load: PageServerLoad = (e) => {
    return e.url.searchParams.get('view') === 'board' ? loadBoardLayout(e) : loadTableLayout(e);
};

const loadTableLayout = async ({
    url,
    parent,
    isDataRequest,
    locals: { runtime }
}: PageServerLoadEvent) => {
    const data = await parent();
    const query: Record<string, unknown> = createIssueListQueryParams({
        projectId: data.project.id,
        url
    });
    const getIssueList = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP((yield* ApiClient).get(`issues`, { query }));
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalIssue>>());
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalIssue>()),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        page: {
            tag: 'table' as const,
            issueList: getIssueList()
        }
    };
};

const loadBoardLayout = async ({
    parent,
    url,
    isDataRequest,
    locals: { runtime }
}: PageServerLoadEvent) => {
    const data = await parent();
    const query: Record<string, unknown> = {
        ...createBoardQueryParams(url),
        projectId: data.project.id
    };

    const getStatusListExit = getWorkspaceStatusList(data.workspace.id).pipe(
        runtime.runPromiseExit
    );

    const getIssueListsExit = Effect.gen(function* () {
        const statusesExit = yield* Effect.promise(() => getStatusListExit);
        if (Exit.isFailure(statusesExit)) {
            return yield* Effect.failCause(statusesExit.cause);
        }
        return yield* getBoardIssueLists(
            query,
            statusesExit.value.items.map((a) => a.id)
        );
    }).pipe(runtime.runPromiseExit);

    if (isDataRequest) {
        return {
            page: {
                tag: 'board' as const,
                statusList: getStatusListExit.then((a) =>
                    Exit.isSuccess(a) ? a.value : paginatedList<LocalWorkspaceStatus>()
                ),
                issueLists: getIssueListsExit.then((a) => (Exit.isSuccess(a) ? a.value : {}))
            }
        };
    }

    const [statusListExit, issueListExit] = await Promise.all([
        maybeStream(
            getStatusListExit.then((a) =>
                Exit.isFailure(a) ? paginatedList<LocalWorkspaceStatus>() : a.value
            )
        )(isDataRequest),
        maybeStream(getIssueListsExit.then((a) => (Exit.isFailure(a) ? {} : a.value)))(
            isDataRequest
        )
    ]);

    return {
        page: {
            tag: 'board' as const,
            statusList: statusListExit(),
            issueLists: issueListExit()
        }
    };
};

const getBoardIssueLists = (query: Record<string, unknown>, statusIds: number[]) =>
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
                    Effect.map((a) => [id, a] as const)
                )
            ),
            {
                concurrency: 'unbounded'
            }
        ).pipe(Effect.map((a) => D.fromPairs(a)));
    });

const getWorkspaceStatusList = (workspaceId: string) =>
    Effect.gen(function* () {
        const api = yield* ApiClient;
        const response = yield* LoadResponse.HTTP(
            api.get(`workspaces/${workspaceId}/statuses`, {
                query: { select: 'Id,Value,Color,Rank,Category', order: 'Rank' }
            })
        );

        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalWorkspaceStatus>>());
    });
