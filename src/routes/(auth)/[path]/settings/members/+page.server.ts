import { error, fail, type ActionFailure } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { HttpError } from '~/lib/models/errors';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { Actions, PageServerLoad } from './$types';
import { ActionResponse } from '~/lib/utils/kit';
import { decodeInviteMember, validateInviteMember } from './utils';

interface WorkspaceMember {
    userId: string;
    user: {
        email: string;
    };
    role: {
        name: string;
    };
}

export const load: PageServerLoad = async ({
    parent,
    depends,
    url,
    isDataRequest,
    locals: { runtime }
}) => {
    depends('fetch:workspace-members');
    const {
        workspace: { id }
    } = await parent();
    const query = queryParams(url, { page: 1, size: 20, order: null });
    const exitPromise = runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get(`workspaces/${id}/members`, {
                    query: {
                        ...query,
                        select: 'UserId, User.Email, Role.Name'
                    }
                });
                if (!response.ok) {
                    return yield* Effect.fail(HttpError.from(response));
                }

                return yield* Effect.tryPromise(() =>
                    response.json<PaginatedList<WorkspaceMember>>()
                );
            }),
            Effect.catchTags({
                ApiError: (e) => Effect.fail({ status: 500, code: e.code, message: e.message }),
                HttpError: (e) =>
                    Effect.fail({ status: e.status, code: e.status + '', message: e.message }),
                UnknownException: (e) =>
                    Effect.fail({ status: 500, code: 'unknown', message: e.message })
            })
        )
    );

    if (isDataRequest) {
        return {
            query: paginatedQuery(query),
            members: exitPromise.then((a) =>
                Exit.isFailure(a) ? paginatedList<WorkspaceMember>() : a.value
            )
        };
    }

    const exit = await exitPromise;
    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        return error(status, body);
    }

    return {
        query: paginatedQuery(query),
        members: exit.value
    };
};

export const actions: Actions = {
    'invite-member': ({
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
        }).pipe(
            Effect.catchAll((a) => Effect.succeed(fail(a.status, { inviteMember: a.data }))),
            runtime.runPromise
        );
    }
};
