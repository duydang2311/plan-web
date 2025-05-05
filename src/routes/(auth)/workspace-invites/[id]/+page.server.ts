import { redirect } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import type { Workspace, WorkspaceInvitation } from '~/lib/models/workspace';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import { attempt } from '~/lib/utils/try';
import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';
import type { Actions, PageServerLoad } from './$types';

export type LocalWorkspaceInvitation = Pick<WorkspaceInvitation, 'id'> & {
    workspace: Pick<Workspace, 'path' | 'name'>;
};

export const load: PageServerLoad = async ({ params, locals: { runtime }, isDataRequest }) => {
    const getInvitation = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`workspace-invitations/${params.id}`, {
                query: { select: 'Id,Workspace.Path,Workspace.Name' }
            })
        );

        const json = yield* LoadResponse.JSON(() => response.json<LocalWorkspaceInvitation>());
        return attempt.ok(json);
    }).pipe(
        Effect.catchAll((e) => Effect.succeed(attempt.fail(e))),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        getInvitation: getInvitation()
    };
};

export const actions: Actions = {
    accept: async ({ request, locals: { runtime } }) => {
        const accept = await Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateAccept(decodeAccept(formData))
            );
            const response = yield* ActionResponse.HTTP(
                (yield* ApiClient).post(
                    `workspace-invitations/${validation.data.workspaceInvitationId}/accept`
                )
            );
            return response;
        }).pipe(runtime.runPromiseExit);

        if (Exit.isSuccess(accept)) {
            return redirect(303, '/');
        }
        return ActionResponse.Failure(accept.cause);
    },
    decline: async ({ request, locals: { runtime } }) => {
        const decline = await Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDecline(decodeDecline(formData))
            );
            return yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(
                    `workspace-invitations/${validation.data.workspaceInvitationId}`
                )
            );
        }).pipe(runtime.runPromiseExit);

        if (Exit.isSuccess(decline)) {
            return redirect(303, '/');
        }
        return ActionResponse.Failure(decline.cause);
    }
};

const decodeAccept = (formData: FormData) => {
    return {
        workspaceInvitationId: formData.get('workspaceInvitationId')
    };
};

const validateAccept = validator(
    Type.Object({
        workspaceInvitationId: Type.String()
    }),
    { stripLeadingSlash: true }
);

const decodeDecline = (formData: FormData) => {
    return {
        workspaceInvitationId: formData.get('workspaceInvitationId')
    };
};

const validateDecline = validator(
    Type.Object({
        workspaceInvitationId: Type.String()
    }),
    { stripLeadingSlash: true }
);
