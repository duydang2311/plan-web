import { Effect } from 'effect';
import { type PaginatedList } from '~/lib/models/paginatedList';
import type { WorkspaceStatus } from '~/lib/models/status';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { maybeStream } from '~/lib/utils/promise';
import { attempt } from '~/lib/utils/try';
import type { Actions, PageServerLoad } from './$types';
import {
    decodeAddStatus,
    decodeDeleteStatus,
    validateAddStatus,
    validateDeleteStatus
} from './utils';

export type LocalWorkspaceStatus = Pick<
    WorkspaceStatus,
    'id' | 'rank' | 'value' | 'color' | 'isDefault' | 'description'
>;

export const load: PageServerLoad = async ({ parent, isDataRequest, locals: { runtime } }) => {
    const data = await parent();
    const getStatusList = await Effect.gen(function* () {
        const api = yield* ApiClient;
        const response = yield* LoadResponse.HTTP(
            api.get(`workspaces/${data.workspace.id}/statuses`, {
                query: { select: 'Id,Rank,Value,Color,IsDefault,Description', order: 'Rank' }
            })
        );
        return attempt.ok(
            yield* LoadResponse.JSON(() => response.json<PaginatedList<LocalWorkspaceStatus>>())
        );
    }).pipe(
        Effect.catchAll((a) => Effect.succeed(attempt.fail(a))),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return { getStatusList: getStatusList() };
};

export const actions: Actions = {
    add_status: ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateAddStatus(decodeAddStatus(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).post(`workspaces/${validation.data.workspaceId}/statuses`, {
                    body: {
                        value: validation.data.value,
                        category: validation.data.category,
                        description: validation.data.description
                    }
                })
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    },
    delete_status: ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateDeleteStatus(decodeDeleteStatus(formData))
            );
            yield* ActionResponse.HTTP(
                (yield* ApiClient).delete(`workspace-statuses/${validation.data.statusId}`)
            );
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};
