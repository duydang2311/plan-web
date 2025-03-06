import { Effect } from 'effect';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { queryParams } from '~/lib/utils/url';
import type { PageServerLoad, PageServerLoadEvent } from './$types';
import {
    InvitationListQuery,
    type LocalProjectMember,
    type LocalProjectMemberInvitation
} from './utils';
import {
    decodeDeleteInvitation,
    decodeDeleteMember,
    decodeInviteMember,
    validateDeleteInvitation,
    validateDeleteMember,
    validateInviteMember
} from './utils.server';

export const load: PageServerLoad = async (e) => {
    switch (e.url.searchParams.get('view')) {
        case 'pending':
            return loadPendingInvitations(e);
        default:
            return loadMembers(e);
    }
};

const loadMembers = async ({
    parent,
    url,
    isDataRequest,
    locals: { runtime }
}: PageServerLoadEvent) => {
    const data = await parent();

    const params = {
        ...queryParams(url, { page: 1, size: 20, order: null }),
        projectId: data.project.id,
        select: 'CreatedTime,Id,Role.Id,Role.Name,User.Id,User.Email,User.Profile.Name,User.Profile.DisplayName,User.Profile.Image'
    };
    const memberList = Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get('project-members', {
                query: params
            })
        );
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalProjectMember>>());
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalProjectMember>()),
        runtime.runPromise
    );

    return {
        view: 'members' as const,
        memberList: isDataRequest ? memberList : await memberList
    };
};

const loadPendingInvitations = async ({
    parent,
    url,
    isDataRequest,
    locals: { runtime }
}: PageServerLoadEvent) => {
    const data = await parent();

    const queryParams = InvitationListQuery.params({
        url,
        projectId: data.project.id
    });
    const list = Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get('project-member-invitations', {
                query: queryParams
            })
        );
        return yield* LoadResponse.JSON(() =>
            response.json<PaginatedList<LocalProjectMemberInvitation>>()
        );
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalProjectMember>()),
        runtime.runPromise
    );

    return {
        view: 'pending' as const,
        memberInvitationList: isDataRequest ? list : await list
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
    },
    'delete-invitation': async ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteInvitation(decodeDeleteInvitation(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`project-member-invitations/${validation.data.id}`)
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};
