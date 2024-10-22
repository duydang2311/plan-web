import { fail } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { DeepPick } from 'ts-essentials';
import { type PaginatedList, paginatedList } from '~/lib/models/paginatedList';
import type { TeamInvitation } from '~/lib/models/team';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse } from '~/lib/utils/kit';
import type { Actions, PageServerLoad } from './$types';
import {
    decodeAcceptTeamInvite,
    decodeDeclineTeamInvite,
    validateAcceptTeamInvite,
    validateDeclineTeamInvite
} from './utils';

export const load: PageServerLoad = async ({
    depends,
    isDataRequest,
    locals: { runtime, user }
}) => {
    if (!user) {
        return;
    }

    depends('fetch:home');
    const teamInvitationList = runtime
        .runPromiseExit(getTeamInvitations(user.id))
        .then((a) =>
            Exit.isFailure(a)
                ? paginatedList<TeamInvitation>()
                : (a.value ?? paginatedList<TeamInvitation>())
        );

    return {
        user,
        teamInvitationList: isDataRequest ? teamInvitationList : await teamInvitationList
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

const getTeamInvitations = (userId: string) =>
    Effect.gen(function* (_) {
        const api = yield* ApiClient;
        return yield* _(
            api.get(`users/${userId}/team-invitations`, {
                query: { select: 'Id, Team.Id, Team.Name' }
            }),
            Effect.flatMap((a) =>
                a.ok
                    ? Effect.tryPromise(() =>
                          a.json<
                              PaginatedList<
                                  DeepPick<
                                      TeamInvitation,
                                      { id: never; team: { id: never; name: never } }
                                  >
                              >
                          >()
                      )
                    : Effect.succeed(null)
            ),
            Effect.orElseSucceed(() => null)
        );
    });
