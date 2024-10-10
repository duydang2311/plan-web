import { Effect } from 'effect';
import type { Actions, PageServerLoad } from './$types';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { decodeAddStatus, validateAddStatus } from './utils';

interface WorkspaceStatus {
    id: string;
    value: string;
    color: string;
    description?: string;
    isDefault: boolean;
}

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
                query: { select: 'Id,Value,Color,IsDefault,Description' }
            })
        );
        return yield* LoadResponse.JSON(() => response.json<PaginatedList<WorkspaceStatus>>());
    }).pipe(
        Effect.orElseSucceed(() => paginatedList<WorkspaceStatus>()),
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
                (yield* ApiClient).post(`workspaces/${validation.data.workspaceId}/`, {
                    body: {
                        value: validation.data.value,
                        description: validation.data.description
                    }
                })
            );
            return { addStatus: { success: true } };
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};
