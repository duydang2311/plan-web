import { error, fail } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import type { TeamInvitation } from '~/lib/models/team';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import type { Actions, PageServerLoad } from './$types';
import {
    createTeamInvitationListQueryParams,
    createUserQueryParams,
    createWorkspaceListParams,
    decodeAcceptTeamInvite,
    decodeDeclineTeamInvite,
    validateAcceptTeamInvite,
    validateDeclineTeamInvite,
    type LocalTeamInvitation,
    type LocalUser,
    type LocalWorkspace
} from './utils';

export const load: PageServerLoad = async ({ isDataRequest, locals: { runtime, user } }) => {
    if (!user) {
        return;
    }

    const getUserExit = await getUserEffect(user.id).pipe(runtime.runPromiseExit);
    if (Exit.isFailure(getUserExit)) {
        const { status, ...body } = LoadResponse.Failure(getUserExit);
        return error(status, body);
    }

    const teamInvitationList = runtime
        .runPromiseExit(getTeamInvitationListEffect(user.id))
        .then((a) =>
            Exit.isFailure(a)
                ? paginatedList<TeamInvitation>()
                : (a.value ?? paginatedList<TeamInvitation>())
        );

    const getWorkspaceListExit = getWorkspaceListEffect(user.id).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalWorkspace>()),
        runtime.runPromise
    );

    return {
        user: getUserExit.value,
        teamInvitationList: isDataRequest ? teamInvitationList : await teamInvitationList,
        workspaceList: isDataRequest ? getWorkspaceListExit : await getWorkspaceListExit
    };
};

export const actions: Actions = {
    'accept-team-invitation': async ({ request, locals: { runtime } }) => {
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* Effect.tryPromise(() => request.formData());
                    const validation = yield* ActionResponse.Validation(
                        validateAcceptTeamInvite(decodeAcceptTeamInvite(formData))
                    );
                    const api = yield* ApiClient;
                    const response = yield* api.patch(
                        `team-invitations/${validation.data.teamInvitationId}/accept`
                    );
                    if (!response.ok) {
                        return yield* ActionResponse.HTTPError(response);
                    }
                    return yield* Effect.succeed<void>(void 0);
                }),
                Effect.catchTags({
                    ApiError: ActionResponse.FetchError,
                    UnknownException: ActionResponse.UnknownError
                })
            )
        );

        if (Exit.isFailure(exit)) {
            const failure = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
            return fail(failure.status, { acceptInvite: failure.data });
        }
        return { acceptInvite: { success: true } };
    },
    'decline-team-invitation': async ({ request, locals: { runtime } }) => {
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* Effect.tryPromise(() => request.formData());
                    const validation = yield* ActionResponse.Validation(
                        validateDeclineTeamInvite(decodeDeclineTeamInvite(formData))
                    );
                    const api = yield* ApiClient;
                    const response = yield* api.delete(
                        `team-invitations/${validation.data.teamInvitationId}`
                    );
                    if (!response.ok) {
                        return yield* ActionResponse.HTTPError(response);
                    }
                    return yield* Effect.succeed<void>(void 0);
                }),
                Effect.catchTags({
                    ApiError: ActionResponse.FetchError,
                    UnknownException: ActionResponse.UnknownError
                })
            )
        );

        if (Exit.isFailure(exit)) {
            const failure = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
            return fail(failure.status, { declineInvite: failure.data });
        }
        return { declineInvite: { success: true } };
    }
};

const getUserEffect = (userId: string) =>
    Effect.gen(function* () {
        const params = createUserQueryParams();
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`users/${userId}`, {
                query: params
            })
        );
        return yield* LoadResponse.JSON(() => response.json<LocalUser>());
    });

const getTeamInvitationListEffect = (userId: string) =>
    Effect.gen(function* () {
        const params = createTeamInvitationListQueryParams();
        const response = yield* (yield* ApiClient).get(`users/${userId}/team-invitations`, {
            query: params
        });
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalTeamInvitation>>());
    });

const getWorkspaceListEffect = (userId: string) =>
    Effect.gen(function* () {
        const response = yield* (yield* ApiClient).get('workspaces', {
            query: createWorkspaceListParams(userId)
        });
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalWorkspace>>());
    });
