import { error, fail, type ActionFailure } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { Role } from '~/lib/models/role';
import type { User, UserPreset } from '~/lib/models/user';
import type { WorkspaceInvitation, WorkspaceMember } from '~/lib/models/workspace';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { validator } from '~/lib/utils/validation';
import type { Actions, PageServerLoad, PageServerLoadEvent } from './$types';
import {
    decodeInviteMember,
    pendingMembersParams,
    validateInviteMember,
    workspaceMembersParams
} from './utils';
import { Type } from '~/lib/utils/typebox';

export type LocalWorkspaceMember = Pick<WorkspaceMember, 'createdTime' | 'updatedTime' | 'id'> & {
    user: UserPreset['basicProfile'];
    role: Pick<Role, 'id' | 'name'>;
};

export type LocalWorkspaceInvitation = OneOf<
    { id: WorkspaceInvitation['id'] },
    { optimisticId: string }
> &
    Pick<WorkspaceInvitation, 'createdTime'> & {
        user: UserPreset['basicProfile'] & Pick<User, 'id'>;
    };

export const load: PageServerLoad = (e) => {
    switch (e.url.searchParams.get('view')) {
        case 'pending':
            return loadPendingMembersView(e);
        default:
            return loadActiveMembersView(e);
    }
};

const loadActiveMembersView = async ({
    parent,
    url,
    isDataRequest,
    locals: { runtime }
}: PageServerLoadEvent) => {
    const {
        workspace: { id }
    } = await parent();
    const params = workspaceMembersParams({ url });
    const exitPromise = Effect.gen(function* () {
        const api = yield* ApiClient;
        const response = yield* LoadResponse.HTTP(
            api.get(`workspaces/${id}/members`, {
                query: params
            })
        );
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalWorkspaceMember>>());
    }).pipe(runtime.runPromiseExit);

    if (isDataRequest) {
        return {
            memberList: exitPromise.then((a) =>
                Exit.isFailure(a) ? paginatedList<LocalWorkspaceMember>() : a.value
            )
        };
    }

    const exit = await exitPromise;
    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        return error(status, body);
    }

    return {
        memberList: exit.value
    };
};

const loadPendingMembersView = async ({
    parent,
    url,
    isDataRequest,
    locals: { runtime }
}: PageServerLoadEvent) => {
    const {
        workspace: { id }
    } = await parent();
    const params = pendingMembersParams({ url, workspaceId: id });
    const exitPromise = runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const response = yield* LoadResponse.HTTP(
                    (yield* ApiClient).get(`workspace-invitations`, {
                        query: params
                    })
                );

                return yield* LoadResponse.JSON(() =>
                    response.json<PaginatedList<LocalWorkspaceInvitation>>()
                );
            })
        )
    );

    if (isDataRequest) {
        return {
            invitationList: exitPromise.then((a) =>
                Exit.isFailure(a) ? paginatedList<LocalWorkspaceInvitation>() : a.value
            )
        };
    }

    const exit = await exitPromise;
    if (Exit.isFailure(exit)) {
        const { status, ...body } = LoadResponse.Failure(exit);
        return error(status, body);
    }

    return {
        invitationList: exit.value
    };
};

export const actions: Actions = {
    invite_member: ({
        request,
        locals: { runtime }
    }): Promise<ActionFailure<{ inviteMember: { errors: Record<string, string[]> } }> | null> => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateInviteMember(decodeInviteMember(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).post(`workspaces/${validation.data.workspaceId}/invitations`, {
                    body: { userId: validation.data.userId }
                })
            );
            return null;
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    'delete-member': ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`workspace-members/${formData.get('id')}`)
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    delete_invitation: ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteInvitation(decodeDeleteInvitation(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`workspace-invitations/${validation.data.id}`)
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};

const decodeDeleteInvitation = (formData: FormData) => ({
    id: formData.get('id')
});

const validateDeleteInvitation = validator(
    Type.Object({
        id: Type.String()
    }),
    { stripLeadingSlash: true }
);
