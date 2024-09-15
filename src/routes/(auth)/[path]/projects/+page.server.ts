import { error } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { HttpError } from '~/lib/models/errors';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { PageServerLoad } from './$types';

interface Project {
    id: string;
    name: string;
    identifier: string;
    createdTime: string;
    updatedTime: string;
}

export const load: PageServerLoad = async ({
    parent,
    depends,
    url,
    isDataRequest,
    locals: { runtime }
}) => {
    depends('fetch:projects');
    const {
        workspace: { id }
    } = await parent();
    const query = queryParams(url, { page: 1, size: 20, order: null });
    const exitPromise = runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get(`workspaces/${id}/projects`, {
                    query: {
                        ...query,
                        select: 'Id, Name, Identifier, CreatedTime, UpdatedTime'
                    }
                });
                if (!response.ok) {
                    return yield* Effect.fail(HttpError.from(response));
                }

                return yield* Effect.tryPromise(() => response.json<PaginatedList<Project>>());
            }),
            Effect.catchTags({
                ApiError: (e) => Effect.fail({ status: 500, code: e.code, message: e.message }),
                HttpError: (e) =>
                    Effect.fail({ status: e.status, code: e.status + '', message: e.message }),
                UnknownException: (e) =>
                    Effect.fail({ status: 500, code: 'unknown', message: e.message })
            })
        )
    );

    if (isDataRequest) {
        return {
            query: paginatedQuery(query),
            projects: exitPromise.then((a) =>
                Exit.isFailure(a) ? paginatedList<Project>() : a.value
            )
        };
    }

    const exit = await exitPromise;
    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        return error(status, body);
    }

    return {
        query: paginatedQuery(query),
        projects: exit.value
    };
};
