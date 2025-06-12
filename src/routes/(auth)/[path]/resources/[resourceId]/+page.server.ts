import { Console, Effect } from 'effect';
import { type PaginatedList } from '~/lib/models/paginatedList';
import type { Resource, ResourceFile } from '~/lib/models/resource';
import type { UserPreset } from '~/lib/models/user';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import { attempt } from '~/lib/utils/try';
import { Type } from '~/lib/utils/typebox';
import { validator } from '~/lib/utils/validation';
import type { Actions, PageServerLoad } from './$types';

export type LocalWorkspaceResource = {
    resource: Pick<Resource, 'id' | 'createdTime' | 'updatedTime' | 'name' | 'document'> & {
        creator: UserPreset['basicProfile'];
    };
};

export type LocalResourceFile = Pick<
    ResourceFile,
    'createdTime' | 'updatedTime' | 'id' | 'key' | 'originalName' | 'size' | 'mimeType'
>;

export const load: PageServerLoad = async ({
    params,
    locals: { runtime },
    isDataRequest
}) => {
    const resourceId = params.resourceId;
    const [getWorkspaceResource, getResourceFileList] = await Promise.all([
        Effect.gen(function* () {
            const response = yield* LoadResponse.HTTP(
                (yield* ApiClient).get(`workspace-resources/${resourceId}`, {
                    query: {
                        select: 'Resource.Id,Resource.CreatedTime,Resource.UpdatedTime,Resource.Name,Resource.Document,Resource.Creator.Id,Resource.Creator.Email,Resource.Creator.Profile.Name,Resource.Creator.Profile.DisplayName,Resource.Creator.Profile.Image'
                    }
                })
            );
            const json = yield* LoadResponse.JSON(() => response.json<LocalWorkspaceResource>());
            return attempt.ok(json);
        }).pipe(
            Effect.catchAll((e) => Effect.succeed(attempt.fail(e))),
            runtime.runPromise,
            (a) => maybeStream(a)(isDataRequest)
        ),
        Effect.gen(function* () {
            const response = yield* LoadResponse.HTTP(
                (yield* ApiClient).get(`resource-files`, {
                    query: {
                        resourceId,
                        select: 'CreatedTime,UpdatedTime,Id,Key,OriginalName,Size,MimeType',
                        order: '-Id'
                    }
                })
            );
            const json = yield* LoadResponse.JSON(() =>
                response.json<PaginatedList<LocalResourceFile>>()
            );
            return attempt.ok(json);
        }).pipe(
            Effect.catchAll((e) => Effect.succeed(attempt.fail(e))),
            runtime.runPromise,
            (a) => maybeStream(a)(isDataRequest)
        )
    ]);

    return {
        getWorkspaceResource: getWorkspaceResource(),
        getResourceFileList: getResourceFileList()
    };
};

export const actions: Actions = {
    update_resource_name: async ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateUpdateResourceName(decodeUpdateResourceName(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).patch(`workspace-resources/${validation.data.resourceId}`, {
                    body: {
                        patch: { name: validation.data.name }
                    }
                })
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    delete_resource_file: async ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteResourceFile(decodeDeleteResourceFile(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`resource-files/${validation.data.id}`)
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    update_resource_document_content: async ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateUpdateResourceDocumentContent(decodeUpdateResourceDocumentContent(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).patch(`workspace-resources/${validation.data.resourceId}`, {
                    body: {
                        patch: { documentContent: validation.data.content }
                    }
                })
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
};

const decodeUpdateResourceName = (formData: FormData) => {
    return {
        resourceId: formData.get('resourceId'),
        name: formData.get('name')
    };
};

const validateUpdateResourceName = validator(
    Type.Object({
        resourceId: Type.String({ minLength: 1 }),
        name: Type.String({ minLength: 1 })
    }),
    { stripLeadingSlash: true }
);

const decodeDeleteResourceFile = (formData: FormData) => {
    return {
        id: formData.get('id')
    };
};

const validateDeleteResourceFile = validator(
    Type.Object({
        id: Type.String({ minLength: 1 })
    }),
    { stripLeadingSlash: true }
);

const decodeUpdateResourceDocumentContent = (formData: FormData) => {
    return {
        resourceId: formData.get('resourceId'),
        content: formData.get('content')
    };
};

const validateUpdateResourceDocumentContent = validator(
    Type.Object({
        resourceId: Type.String({ minLength: 1 }),
        content: Type.Union([Type.String(), Type.Null()])
    }),
    { stripLeadingSlash: true }
);