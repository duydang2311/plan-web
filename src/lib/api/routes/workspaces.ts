import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse } from '../utils/hono';
import type { WorkspaceStatus } from '~/lib/models/status';
import type { PaginatedList } from '~/lib/models/paginatedList';

export const workspaces = new Hono()
    .basePath('/workspaces')
    .use(requireAuth)
    .get('/:id/statuses', (c) =>
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* HonoResponse.HTTP(
                    api.get(`workspaces/${c.req.param('id')}/statuses`)
                );
                const json = yield* HonoResponse.JSON(() =>
                    response.json<PaginatedList<WorkspaceStatus>>()
                );
                return c.json(json, 200);
            }),
            Effect.catchAll(Effect.succeed),
            c.var.runtime.runPromise
        )
    );
