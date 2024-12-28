import { error, fail } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { type PaginatedList, paginatedList } from '~/lib/models/paginatedList';
import type { Team, TeamInvitation } from '~/lib/models/team';
import type { UserProfile } from '~/lib/models/user';
import type { Workspace } from '~/lib/models/workspace';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import type { Actions, PageServerLoad } from './$types';
import {
    createWorkspaceListParams,
    decodeAcceptTeamInvite,
    decodeDeclineTeamInvite,
    validateAcceptTeamInvite,
    validateDeclineTeamInvite
} from './utils';

export type LocalWorkspace = Pick<Workspace, 'name' | 'path'>;

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
        user: {
            ...getUserExit.value,
            id: user.id
        },
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
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`users/${userId}`, {
                query: { select: 'Profile.Name,Profile.DisplayName,Profile.Image' }
            })
        );
        return yield* LoadResponse.JSON(() =>
            response.json<{
                profile?: Pick<UserProfile, 'name' | 'displayName' | 'image'>;
            }>()
        );
    });

const getTeamInvitationListEffect = (userId: string) =>
    Effect.gen(function* () {
        const response = yield* (yield* ApiClient).get(`users/${userId}/team-invitations`, {
            query: { select: 'Id, Team.Id, Team.Name' }
        });
        return yield* LoadResponse.JSON(() =>
            response.json<
                PaginatedList<Pick<TeamInvitation, 'id'> & { team: Pick<Team, 'id' | 'name'> }>
            >()
        );
    });

const getWorkspaceListEffect = (userId: string) =>
    Effect.gen(function* () {
        const response = yield* (yield* ApiClient).get('workspaces', {
            query: createWorkspaceListParams(userId)
        });
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalWorkspace>>());
    });
