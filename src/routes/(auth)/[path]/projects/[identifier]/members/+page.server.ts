import { Cause, Effect, Exit, Option } from 'effect';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import type { Actions, PageServerLoad } from './$types';
import { createProjectMemberListQueryParams, type LocalProjectMember } from './utils';
import { fail } from '@sveltejs/kit';
import { decodeDeleteMember, validateDeleteMember } from './utils.server';

export const load: PageServerLoad = async ({ parent, url, locals: { runtime }, isDataRequest }) => {
    const data = await parent();

    const memberList = Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get('project-members', {
                query: createProjectMemberListQueryParams(() => ({
                    projectId: data.project.id,
                    url
                }))
            })
        );
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalProjectMember>>());
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalProjectMember>()),
        runtime.runPromise
    );

    return {
        memberList: isDataRequest ? memberList : await memberList
    };
};

export const actions: Actions = {
    'delete-member': async ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteMember(decodeDeleteMember(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`project-members/${validation.data.id}`)
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};
