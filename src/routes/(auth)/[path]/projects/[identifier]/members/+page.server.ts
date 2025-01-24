import { Effect } from 'effect';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import type { PageServerLoad } from './$types';
import { createProjectMemberListQueryParams, type LocalProjectMember } from './utils';
import {
    decodeDeleteMember,
    decodeInviteMember,
    validateDeleteMember,
    validateInviteMember
} from './utils.server';

export const load: PageServerLoad = async ({ parent, url, locals: { runtime }, isDataRequest }) => {
    const data = await parent();

    const queryParams = createProjectMemberListQueryParams(() => ({
        projectId: data.project.id,
        url
    }));
    const memberList = Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get('project-members', {
                query: queryParams
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

export const actions = {
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
    },
    'invite-member': async ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateInviteMember(decodeInviteMember(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).post(`project-member-invitations`, {
                    body: {
                        projectId: validation.data.projectId,
                        userId: validation.data.userId,
                        role: 2 // ProjectRole.Member
                    }
                })
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};
