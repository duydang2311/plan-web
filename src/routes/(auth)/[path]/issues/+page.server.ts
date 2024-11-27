import { error } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { Issue } from '~/lib/models/issue';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { LoadResponse } from '~/lib/utils/kit';
import { paginatedQuery, queryParams, stringifyQuery } from '~/lib/utils/url';
import type { PageServerLoad } from './$types';

export type LocalIssue = Pick<
    Issue,
    'createdTime' | 'updatedTime' | 'id' | 'orderNumber' | 'title' | 'priority'
> & {
    team: { identifier: string };
    status?: { value: string; rank: string };
};

export const load: PageServerLoad = async ({
    url,
    fetch,
    parent,
    isDataRequest,
    locals: { runtime }
}) => {
    const data = await parent();
    const query: Record<string, unknown> = {
        ...paginatedQuery(
            queryParams(url, {
                page: 1,
                size: 20,
                order: null
            })
        ),
        select: 'CreatedTime,UpdatedTime,Id,OrderNumber,Title,Team.Identifier,Status.Value,Status.Rank,Priority'
    };
    const teamIdentifier = url.searchParams.get('team');
    const projectIdentifier = url.searchParams.get('project');
    const exitPromise = Effect.gen(function* () {
        if (teamIdentifier) {
            const teamId = yield* fetchTeamIdEffect(fetch, data.workspace.id, teamIdentifier);
            query['teamId'] = teamId;
        }

        if (projectIdentifier) {
            const projectId = yield* fetchProjectIdEffect(
                fetch,
                data.workspace.id,
                projectIdentifier
            );
            query['projectId'] = projectId;
        }

        const response = yield* LoadResponse.Fetch(() =>
            fetch(`/api/issues?${stringifyQuery(query)}`)
        );
        return {
            issueList: yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalIssue>>()),
            teamId: query['teamId'] as string | undefined
        };
    }).pipe(runtime.runPromiseExit);

    if (isDataRequest) {
        return {
            page: exitPromise.then((a) =>
                Exit.isSuccess(a)
                    ? a.value
                    : {
                          issueList: paginatedList<LocalIssue>()
                      }
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
    return { page: exit.value };
};

const fetchTeamIdEffect = (
    fetch: typeof globalThis.fetch,
    workspaceId: string,
    teamIdentifier: string
) => {
    return Effect.gen(function* () {
        const response = yield* LoadResponse.Fetch(() =>
            fetch(`/api/workspaces/${workspaceId}/teams/identifier/${teamIdentifier}?select=Id`, {
                method: 'get'
            })
        );
        const json = yield* LoadResponse.JSON(() => response.json<{ id: string }>());
        return json.id;
    });
};

const fetchProjectIdEffect = (
    fetch: typeof globalThis.fetch,
    workspaceId: string,
    projectIdentifier: string
) => {
    return Effect.gen(function* () {
        const response = yield* LoadResponse.Fetch(() =>
            fetch(
                `/api/workspaces/${workspaceId}/projects/identifier/${projectIdentifier}?select=Id`,
                { method: 'get' }
            )
        );
        const json = yield* LoadResponse.JSON(() => response.json<{ id: string }>());
        return json.id;
    });
};
