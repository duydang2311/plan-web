import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { paginatedQuery, queryParams } from '~/lib/utils/url';

interface ProjectIssue {
    issue: {
        id: string;
        title: string;
        createdTime: string;
        updatedTime: string;
        orderNumber: number;
        team: { identifier: string };
    };
    rank: string;
}

export const load: PageServerLoad = async ({
    parent,
    depends,
    url,
    isDataRequest,
    locals: { runtime }
}) => {
    depends('fetch:project-issues');

    const data = await parent();
    const query = paginatedQuery(queryParams(url, { page: 1, size: 20 }));
    const exitPromise = runtime.runPromiseExit(
        Effect.gen(function* () {
            const api = yield* ApiClient;
            const response = yield* LoadResponse.HTTP(
                api.get(`projects/${data.project.id}/issues`, {
                    query: {
                        ...query,
                        select: 'Rank, Issue.Id, Issue.Title, Issue.CreatedTime, Issue.UpdatedTime, Issue.OrderNumber, Issue.Team.Identifier'
                    }
                })
            );
            return yield* LoadResponse.JSON(() => response.json<PaginatedList<ProjectIssue>>());
        })
    );
    if (isDataRequest) {
        return {
            projectIssueList: exitPromise.then((a) =>
                Exit.isFailure(a) ? paginatedList<ProjectIssue>() : a.value
            )
        };
    }

    const exit = await exitPromise;
    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        return error(status, body);
    }

    return {
        query,
        projectIssueList: exit.value
    };
};
