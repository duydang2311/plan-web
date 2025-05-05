import { error, redirect } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import type { Project, ProjectMemberInvitation } from '~/lib/models/project';
import type { Role } from '~/lib/models/role';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';
import type { Actions, PageServerLoad } from './$types';

export type LocalProjectMemberInvitation = Pick<ProjectMemberInvitation, 'id'> & {
    project: Pick<Project, 'id' | 'name'>;
    role: Pick<Role, 'name'>;
};

export const load: PageServerLoad = async ({ params, locals: { runtime } }) => {
    const getInvitation = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`project-member-invitations/${params.id}`, {
                query: { select: 'Id,Project.Id,Project.Name,Role.Name' }
            })
        );

        return yield* LoadResponse.JSON(() => response.json<LocalProjectMemberInvitation>());
    }).pipe(runtime.runPromiseExit);

    if (Exit.isFailure(getInvitation)) {
        const { status, ...body } = LoadResponse.Failure(getInvitation);
        return error(status, body);
    }

    return {
        invitation: getInvitation.value
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
                    `project-member-invitations/${validation.data.projectMemberInvitationId}/accept`
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
                    `project-member-invitations/${validation.data.projectMemberInvitationId}`
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
        projectMemberInvitationId: formData.get('projectMemberInvitationId')
    };
};

const validateAccept = validator(
    Type.Object({
        projectMemberInvitationId: Type.String()
    }),
    { stripLeadingSlash: true }
);

const decodeDecline = (formData: FormData) => {
    return {
        projectMemberInvitationId: formData.get('projectMemberInvitationId')
    };
};

const validateDecline = validator(
    Type.Object({
        projectMemberInvitationId: Type.String()
    }),
    { stripLeadingSlash: true }
);
