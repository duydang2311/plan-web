import { Effect } from 'effect';
import { Hono } from 'hono';
import { validator } from 'hono/validator';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { WorkspaceStatus } from '~/lib/models/status';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse, success } from '../utils/hono';

export const workspaces = new Hono()
    .basePath('/workspaces')
    .use(requireAuth)
    .get(
        '/:id/statuses',
        validator('query', (_, c) => {
            return { select: c.req.query('select') };
        }),
        (c) => {
            return Effect.gen(function* () {
                const query = c.req.valid('query');
                const api = yield* ApiClient;
                const response = yield* HonoResponse.HTTP(
                    api.get(`workspaces/${c.req.param('id')}/statuses`, {
                        query
                    })
                );
                const json = yield* HonoResponse.JSON(() =>
                    response.json<PaginatedList<WorkspaceStatus>>()
                );
                return c.json(success(json), 200);
            }).pipe(Effect.catchAll(Effect.succeed), c.var.runtime.runPromise);
        }
    );
