import type { PageServerLoad } from './$types';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { LoadResponse } from '~/lib/utils/kit';
import type { Issue } from '~/lib/models/issue';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { error } from '@sveltejs/kit';

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
    const exitPromise = Effect.gen(function* () {
        const data = yield* Effect.promise(() => parent());
        const teamIdentifier = url.searchParams.get('team');
        const projectIdentifier = url.searchParams.get('project');

        const searchParams = new URLSearchParams(url.searchParams);
        searchParams.set(
            'select',
            'CreatedTime,UpdatedTime,Id,OrderNumber,Title,Team.Identifier,Status.Value,Status.Rank,Priority'
        );
        if (teamIdentifier) {
            searchParams.delete('team');
            const response = yield* LoadResponse.Fetch(() =>
                fetch(
                    `/api/workspaces/${data.workspace.id}/teams/identifier/${teamIdentifier}?select=Id`,
                    { method: 'get' }
                )
            );
            const json = yield* LoadResponse.JSON(() => response.json<{ id: string }>());
            searchParams.set('teamId', json.id);
        }

        if (projectIdentifier) {
            searchParams.delete('project');
            const response = yield* LoadResponse.Fetch(() =>
                fetch(
                    `/api/workspaces/${data.workspace.id}/projects/identifier/${projectIdentifier}?select=Id`,
                    { method: 'get' }
                )
            );
            const json = yield* LoadResponse.JSON(() => response.json<{ id: string }>());
            searchParams.set('projectId', json.id);
        }

        const issueQueryParams = searchParams.toString();
        const response = yield* LoadResponse.Fetch(() =>
            fetch(`/api/issues?${searchParams.toString()}`)
        );
        return {
            issueQueryParams,
            issueList: yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalIssue>>())
        };
    }).pipe(runtime.runPromiseExit);

    if (isDataRequest) {
        return exitPromise.then((a) =>
            Exit.isSuccess(a)
                ? a.value
                : {
                      issueQueryParams: '',
                      issueList: paginatedList<LocalIssue>()
                  }
        );
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
    return exit.value;
};
