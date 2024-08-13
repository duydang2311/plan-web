import { error } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { TeamMember } from '~/lib/models/team';
import { ApiClient } from '~/lib/services/api_client.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent, depends, locals: { runtime } }) => {
    depends('fetch:team-members');
    const data = await parent();
    const exit = await runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get(`teams/${data.team.id}/members`, {
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
        team: data.team,
        teamMemberList: exit.value
    };
};
