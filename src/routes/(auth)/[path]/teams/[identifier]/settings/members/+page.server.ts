import { error, fail } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { Team, TeamInvitation, TeamMember } from '~/lib/models/team';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse } from '~/lib/utils/kit';
import type { Actions, PageServerLoad } from './$types';
import { decodeInvite, validateInvite } from './utils';

export const load: PageServerLoad = async ({ url, parent, depends, locals }) => {
    const data = await parent();
    switch (url.searchParams.get('show')) {
        case 'pending':
            depends('fetch:team-invitations');
            return getPendingMembers(data.team, locals);
        default:
            depends('fetch:team-members');
            return getAllMembers(data.team, locals);
    }
};

export const actions: Actions = {
    invite: async ({ request, locals: { runtime } }) => {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* Effect.tryPromise(() => request.formData());
                    const validation = yield* ActionResponse.Validation(
                        validateInvite(decodeInvite(formData))
                    );

                    const api = yield* ApiClient;
                    const response = yield* api.post(
                        `teams/${validation.data.teamId}/invitations`,
                        {
                            body: { memberId: validation.data.memberId }
                        }
                    );

                    if (!response.ok) {
                        return yield* ActionResponse.HTTPError(response);
                    }

                    return yield* Effect.void;
                }),
                Effect.catchTags({
                    ApiError: ActionResponse.FetchError,
                    UnknownException: ActionResponse.UnknownError
                })
            )
        );

        console.dir(exit, { depth: null });
        if (Exit.isFailure(exit)) {
            const failure = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
            return fail(failure.status, { invite: failure.data });
        }

        return { invite: { success: true } };
    }
};

async function getAllMembers(
    team: Pick<Team, 'id' | 'name' | 'identifier'>,
    { runtime }: App.Locals
) {
    const exit = await runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get(`teams/${team.id}/members`, {
                    query: {
                        select: 'CreatedTime, UpdatedTime, TeamId, Member.Id, Member.Email, Role.Id, Role.Name'
                    }
                });
                if (!response.ok) {
                    return yield* Effect.fail({
                        status: response.status,
                        code: response.status + '',
                        message: response.statusText
                    });
                }
                return yield* Effect.tryPromise(() => response.json<PaginatedList<TeamMember>>());
            }),
            Effect.catchTags({
                ApiError: (e) => Effect.fail({ status: 500, code: e.code, message: e.message }),
                UnknownException: () =>
                    Effect.fail({
                        status: 500,
                        code: 'unknown',
                        message: 'An unknown error has occurred.'
                    })
            })
        )
    );

    if (Exit.isFailure(exit)) {
        const { status, ...data } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        return error(status, data);
    }

    return {
        team: team,
        teamMemberList: exit.value
    };
}

async function getPendingMembers(
    team: Pick<Team, 'id' | 'name' | 'identifier'>,
    { runtime }: App.Locals
) {
    const exit = await runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get(`teams/${team.id}/invitations`, {
                    query: {
                        select: 'CreatedTime, TeamId, Member.Id, Member.Email'
                    }
                });
                if (!response.ok) {
                    return yield* Effect.fail({
                        status: response.status,
                        code: response.status + '',
                        message: response.statusText
                    });
                }
                return yield* Effect.tryPromise(() =>
                    response.json<PaginatedList<TeamInvitation>>()
                );
            }),
            Effect.catchTags({
                ApiError: (e) => Effect.fail({ status: 500, code: e.code, message: e.message }),
                UnknownException: () =>
                    Effect.fail({
                        status: 500,
                        code: 'unknown',
                        message: 'An unknown error has occurred.'
                    })
            })
        )
    );

    if (Exit.isFailure(exit)) {
        const { status, ...data } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        return error(status, data);
    }

    return {
        team: team,
        teamInvitationList: exit.value
    };
}
