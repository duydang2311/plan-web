import { fail } from '@sveltejs/kit';
import { Effect } from 'effect';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
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
    const getProjectList = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP((yield* ApiClient).get(`projects`, { query }));
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalProject>>());
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalProject>()),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        projectList: getProjectList()
    };
};

export const actions: Actions = {
    delete_project: ({ request, locals: { runtime } }) => {
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
