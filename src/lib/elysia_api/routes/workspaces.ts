import { Effect } from 'effect';
import type { PaginatedList } from '~/lib/models/paginatedList';
import type { WorkspaceStatus } from '~/lib/models/status';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';
import { queryParamsDict } from '../utils/url';
import { paginatedQuery } from '~/lib/utils/url';

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
    })
    .get('/:id/projects', ({ params, query, runtime }) => {
        return Effect.gen(function* () {
            const response = yield* ElysiaResponse.HTTP(
                (yield* ApiClient).get(`workspaces/${params.id}/projects`, {
                    query: paginatedQuery(
                        queryParamsDict(query, {
                            page: 1,
                            offset: 0,
                            size: 20,
                            order: null,
                            select: null
                        })
                    )
                })
            );
            const json = yield* ElysiaResponse.JSON(() => response.json());
            return Response.json(json, { status: response.status });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    })
    .get('/:id/teams/identifier/:identifier', ({ params, query, runtime }) => {
        return Effect.gen(function* () {
            const response = yield* ElysiaResponse.HTTP(
                (yield* ApiClient).get(
                    `workspaces/${params.id}/teams/identifier/${params.identifier}`,
                    { query }
                )
            );
            const json = yield* ElysiaResponse.JSON(() => response.json());
            return Response.json(json, { status: response.status });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    })
    .get('/:id/projects/identifier/:identifier', ({ params, query, runtime }) => {
        return Effect.gen(function* () {
            const response = yield* ElysiaResponse.HTTP(
                (yield* ApiClient).get(
                    `workspaces/${params.id}/projects/identifier/${params.identifier}`,
                    { query }
                )
            );
            const json = yield* ElysiaResponse.JSON(() => response.json());
            return Response.json(json, { status: response.status });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    });
