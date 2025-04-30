import { error } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import type { LayoutServerLoad } from './$types';
import { PermissionService } from '~/lib/services/permission_service.server';
import { maybeStream } from '~/lib/utils/promise';

const pathIdMap = new Map<string, string>();

export const load: LayoutServerLoad = async ({
    params,
    locals: { user, runtime },
    url,
    isDataRequest
}) => {
    const exit = await runtime.runPromiseExit(
        Effect.gen(function* () {
            const apiClient = yield* ApiClient;
            const id = pathIdMap.get(params.path);
            let response: Response;
            if (id) {
                response = yield* apiClient.get(`workspaces/${id}`, {
                    query: { select: 'Id, Name' }
                });
            } else {
                response = yield* apiClient.get(`workspaces/path/${params.path}`, {
                    query: { select: 'Id, Name' }
                });
            }
            if (!response.ok) {
                return yield* Effect.fail<void>(void 0);
            }

            const json = yield* Effect.promise<{ id: string; name: string }>(() => response.json());
            if (!id) {
                pathIdMap.set(params.path, json.id);
            }
            return json;
        })
    );
    if (Exit.isFailure(exit)) {
        return error(404, { message: 'Workspace does not exist', code: 'workspace_not_found' });
    }

    const workspacePermissions = await Effect.gen(function* () {
        const list = yield* (yield* PermissionService).getWorkspacePermissions(
            exit.value.id,
            user.id
        );
        return new Set(list.items);
    }).pipe(
        Effect.orElseSucceed(() => new Set<string>()),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        user,
        workspace: exit.value,
        pathname: url.pathname,
        workspacePermissions: workspacePermissions()
    };
};
