import { Effect } from 'effect';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { WorkspaceStatus } from '~/lib/models/status';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';
import { queryParamsDict } from '../utils/url';

export const workspaces = baseApp({ prefix: '/workspaces' })
    .use(requireAuth)
    .get('/:id/statuses', ({ query, params, runtime }) => {
        return Effect.gen(function* () {
            const q = queryParamsDict(query, { select: null, order: null });
            const api = yield* ApiClient;
            const response = yield* ElysiaResponse.HTTP(
                api.get(`workspaces/${params.id}/statuses`, {
                    query: q
                })
            );
            const json = yield* ElysiaResponse.JSON(() =>
                response.json<PaginatedList<WorkspaceStatus>>()
            );
            return Response.json(json, { status: 200 });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    });
