import { error, fail } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { Type } from '~/lib/utils/typebox';
import { paginatedQuery, queryParams } from '~/lib/utils/url';
import { validator } from '~/lib/utils/validation';
import type { Actions, PageServerLoad } from './$types';

export interface LocalProject {
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

    const query = {
        ...paginatedQuery(queryParams(url, { page: 1, size: 20, order: null })),
        select: 'Id,Name,Identifier,CreatedTime,UpdatedTime',
        workspaceId: id
    };
    const exitPromise = Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`projects`, {
                query
            })
        );
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalProject>>());
    }).pipe(runtime.runPromiseExit);

    if (isDataRequest) {
        return {
            query,
            projects: exitPromise.then((a) =>
                Exit.isFailure(a) ? paginatedList<LocalProject>() : a.value
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

export const actions: Actions = {
    'delete-project': ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteProject(decodeDeleteProject(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`projects/${validation.data.projectId}`)
            );
        }).pipe(
            Effect.catchAll((e) => Effect.succeed(fail(e.status, { deleteProject: e.data }))),
            runtime.runPromise
        );
    }
};

const decodeDeleteProject = (formData: FormData) => ({
    projectId: formData.get('projectId')
});

const validateDeleteProject = validator(
    Type.Object({
        projectId: Type.String()
    }),
    { stripLeadingSlash: true }
);
