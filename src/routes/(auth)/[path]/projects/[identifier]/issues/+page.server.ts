import { D } from '@mobily/ts-belt';
import { Effect, Exit, pipe, type Context } from 'effect';
import type { Issue } from '~/lib/models/issue';
import type { Milestone } from '~/lib/models/milestone';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { WorkspaceStatus } from '~/lib/models/status';
import type { User, UserPreset } from '~/lib/models/user';
import { ApiClient } from '~/lib/services/api_client.server';
import type { HttpClient } from '~/lib/services/http_client';
import { LoadAttempt, LoadResponse } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import type { PageServerLoad, PageServerLoadEvent } from './$types';
import { createBoardQueryParams, createIssueListQueryParams } from './utils';

export type LocalMilestone = Pick<Milestone, 'id' | 'title' | 'emoji' | 'color'>;
export type LocalTimelineMilestone = Pick<
    Milestone,
    'id' | 'endTime' | 'endTimeZone' | 'title' | 'emoji' | 'color'
>;

export type LocalIssue = Pick<
    Issue,
    | 'createdTime'
    | 'updatedTime'
    | 'id'
    | 'orderNumber'
    | 'title'
    | 'priority'
    | 'previewDescription'
> & {
    project: { identifier: string };
    status?: Pick<WorkspaceStatus, 'value' | 'color' | 'rank' | 'category'>;
    milestone?: LocalMilestone;
    assignees: (Pick<User, 'email'> & UserPreset['profile'])[];
};

export type LocalBoardIssue = Pick<
    Issue,
    | 'createdTime'
    | 'updatedTime'
    | 'id'
    | 'orderNumber'
    | 'title'
    | 'statusRank'
    | 'priority'
    | 'previewDescription'
    | 'startTime'
    | 'endTime'
> & {
    author: UserPreset['email'] & UserPreset['profile'];
    status?: Pick<WorkspaceStatus, 'id' | 'value' | 'color' | 'rank' | 'category'>;
    milestone?: LocalMilestone;
};

export type LocalTimelineIssue = Pick<
    Issue,
    'id' | 'title' | 'startTime' | 'endTime' | 'orderNumber' | 'timelineZone'
>;

export type LocalWorkspaceStatus = Pick<WorkspaceStatus, 'id' | 'value' | 'color' | 'category'>;

export interface PageBoardData {
    statuses: PaginatedList<LocalWorkspaceStatus>;
    issueLists: Record<string, PaginatedList<LocalBoardIssue>>;
    project: { identifier: string };
}

export const load: PageServerLoad = (e) => {
    switch (e.url.searchParams.get('view')) {
        case 'board':
            return loadBoardLayout(e);
        case 'timeline':
            return loadTimelineLayout(e);
        default:
            return loadTableLayout(e);
    }
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
    locals,
    locals: { runtime }
}: PageServerLoadEvent) => {
    const data = await parent();
    const query: Record<string, unknown> = {
        ...createBoardQueryParams(url),
        projectId: data.project.id
    };

    const getStatusListAttempt = getWorkspaceStatusList(locals.api)(data.workspace.id);

    const getIssueListsExit = Effect.gen(function* () {
        const attempt = yield* Effect.promise(() => getStatusListAttempt);
        if (attempt.failed) {
            return {};
        }
        return yield* getBoardIssueLists(
            query,
            attempt.data.items.map((a) => a.id)
        );
    }).pipe(runtime.runPromiseExit);

    return {
        page: {
            tag: 'board' as const,
            statusList: (await maybeStream(getStatusListAttempt)(isDataRequest))(),
            issueLists: (
                await maybeStream(
                    getIssueListsExit.then((a) => (Exit.isFailure(a) ? {} : a.value))
                )(isDataRequest)
            )()
        }
    };
};

const loadTimelineLayout = async ({ parent, locals, isDataRequest }: PageServerLoadEvent) => {
    const data = await parent();
    const timelineIssueListAttempt = await maybeStream(
        getTimelineIssueList(locals.api)(data.project.id)
    )(isDataRequest);
    const timelineMilestoneListAttempt = await maybeStream(
        getTimelineMilestoneList(locals.api)(data.project.id)
    )(isDataRequest);
    return {
        page: {
            tag: 'timeline' as const,
            issueList: timelineIssueListAttempt(),
            milestoneList: timelineMilestoneListAttempt()
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

const getWorkspaceStatusList =
    (api: Context.Tag.Service<HttpClient>) => async (workspaceId: string) => {
        const getAttempt = await LoadAttempt.HTTP(() =>
            api.get(`workspaces/${workspaceId}/statuses`, {
                query: { select: 'Id,Value,Color,Rank,Category', order: 'Rank' }
            })
        );
        if (getAttempt.failed) {
            return getAttempt;
        }
        return LoadAttempt.JSON(() => getAttempt.data.json<PaginatedList<LocalWorkspaceStatus>>());
    };

const getTimelineIssueList =
    (api: Context.Tag.Service<HttpClient>) => async (projectId: string) => {
        const getAttempt = await LoadAttempt.HTTP(() =>
            api.get('issues', {
                query: {
                    projectId,
                    select: 'Id,Title,StartTime,EndTime,OrderNumber,TimelineZone',
                    order: 'StartTime,OrderNumber',
                    size: 1000
                }
            })
        );
        if (getAttempt.failed) {
            return getAttempt;
        }
        return LoadAttempt.JSON(() => getAttempt.data.json<PaginatedList<LocalBoardIssue>>());
    };

const getTimelineMilestoneList =
    (api: Context.Tag.Service<HttpClient>) => async (projectId: string) => {
        const getAttempt = await LoadAttempt.HTTP(() =>
            api.get('milestones', {
                query: {
                    projectId,
                    select: 'Id,Title,Emoji,Color,EndTime,EndTimeZone',
                    order: 'EndTime'
                }
            })
        );
        if (getAttempt.failed) {
            return getAttempt;
        }
        return LoadAttempt.JSON(() =>
            getAttempt.data.json<PaginatedList<LocalTimelineMilestone>>()
        );
    };
