import { Effect } from 'effect';
import type { Actions, PageServerLoad } from './$types';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import {
    decodeAddStatus,
    decodeDeleteStatus,
    validateAddStatus,
    validateDeleteStatus
} from './utils';
import { fail } from '@sveltejs/kit';
import type { WorkspaceStatus } from '~/lib/models/status';

export type LocalWorkspaceStatus = Pick<
    WorkspaceStatus,
    'id' | 'rank' | 'value' | 'color' | 'isDefault' | 'description'
>;

export const load: PageServerLoad = async ({
    parent,
    depends,
    isDataRequest,
    locals: { runtime }
}) => {
    depends('fetch:workspace-statuses');
    const data = await parent();
    const promise = Effect.gen(function* () {
        const api = yield* ApiClient;
        const response = yield* LoadResponse.HTTP(
            api.get(`workspaces/${data.workspace.id}/statuses`, {
                query: { select: 'Id,Rank,Value,Color,IsDefault,Description' }
            })
        );
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalWorkspaceStatus>>());
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<LocalWorkspaceStatus>()),
        runtime.runPromise
    );

    if (!isDataRequest) {
        return { statusList: await promise };
    }

    return { statusList: promise };
};

export const actions: Actions = {
    'add-status': ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateAddStatus(decodeAddStatus(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).post(`workspaces/${validation.data.workspaceId}/statuses`, {
                    body: {
                        value: validation.data.value,
                        description: validation.data.description
                    }
                })
            );
            return { addStatus: { success: true } };
        }).pipe(
            Effect.catchAll((a) => Effect.succeed(fail(a.status, { addStatus: a.data }))),
            runtime.runPromise
        );
    },
    'delete-status': ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteStatus(decodeDeleteStatus(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`workspace-statuses/${validation.data.statusId}`)
            );
            return { deleteStatus: { success: true } };
        }).pipe(
            Effect.catchAll((a) => Effect.succeed(fail(a.status, { deleteStatus: a.data }))),
            runtime.runPromise
        );
    }
};
