import { decode } from 'decode-formdata';
import { Effect } from 'effect';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { Resource } from '~/lib/models/resource';
import type { UserPreset } from '~/lib/models/user';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import { attempt } from '~/lib/utils/try';
import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';
import type { Actions, PageServerLoad } from './$types';

export type LocalWorkspaceResource = {
    resource: OneOf<Pick<Resource, 'id'>, { optimisticId: number }> &
        Pick<Resource, 'createdTime' | 'name' | 'rank' | 'document' | 'files'> & {
            creator: UserPreset['basicProfile'];
        };
};

export const load: PageServerLoad = async ({ parent, locals: { runtime }, isDataRequest }) => {
    const {
        workspace: { id }
    } = await parent();
    const getResources = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`workspaces/${id}/resources`, {
                query: {
                    workspaceId: id,
                    select: 'Resource.Id,Resource.CreatedTime,Resource.Name,Resource.Document,Resource.Files,Resource.Rank,Resource.Creator.Id,Resource.Creator.Email,Resource.Creator.Profile.Name,Resource.Creator.Profile.DisplayName,Resource.Creator.Profile.Image'
                }
            })
        );

        const json = yield* LoadResponse.JSON(() =>
            response.json<PaginatedList<LocalWorkspaceResource>>()
        );
        return attempt.ok(json);
    }).pipe(
        Effect.catchAll((e) => Effect.succeed(attempt.fail(e))),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        getResources: getResources()
    };
};

export const actions: Actions = {
    create_resource: async ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateCreateResource(decodeCreateResource(formData))
            );

            yield* ActionResponse.HTTP(
                (yield* ApiClient).post(`workspace-resources`, {
                    body: {
                        workspaceId: validation.data.workspaceId,
                        name: validation.data.name,
                        content: validation.data.content,
                        files: validation.data.files
                    }
                })
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    delete_resource: async ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteResource(decodeDeleteResource(formData))
            );

            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`workspace-resources/${validation.data.id}`)
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};

const decodeCreateResource = (formData: FormData) => {
    return decode(formData, {
        arrays: ['files'],
        numbers: ['files.$.pendingUploadId', 'files.$.size']
    });
};

const validateCreateResource = validator(
    Type.Object({
        workspaceId: Type.String(),
        name: Type.String(),
        content: Type.Optional(Type.String()),
        files: Type.Optional(
            Type.Array(
                Type.Object({
                    key: Type.String(),
                    originalName: Type.String(),
                    size: Type.Number(),
                    mimeType: Type.String(),
                    pendingUploadId: Type.Optional(Type.Number())
                })
            )
        )
    }),
    { stripLeadingSlash: true, convert: true }
);

const decodeDeleteResource = (formData: FormData) => {
    return {
        id: formData.get('id')
    };
};

const validateDeleteResource = validator(
    Type.Object({
        id: Type.String()
    })
);
