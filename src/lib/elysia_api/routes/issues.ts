import { Effect } from 'effect';
import { t } from 'elysia';
import type { IssueComment } from '~/lib/models/issue_comment';
import type { PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { paginatedQuery } from '~/lib/utils/url';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';
import { queryParamsDict } from '../utils/url';

export const issues = baseApp({ prefix: '/issues' })
    .use(requireAuth)
    .get('/:id', ({ query, params, runtime }) => {
        return Effect.gen(function* () {
            const response = yield* ElysiaResponse.HTTP(
                (yield* ApiClient).get(`issues/${params.id}`, {
                    query
                })
            );
            const list = yield* ElysiaResponse.JSON(() =>
                response.json<PaginatedList<IssueComment>>()
            );
            return Response.json(list, { status: 200 });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    })
    .get('/:id/comments', ({ query, params, runtime }) => {
        return Effect.gen(function* () {
            const api = yield* ApiClient;
            const response = yield* ElysiaResponse.HTTP(
                api.get(`issues/${params.id}/comments`, {
                    query: paginatedQuery(
                        queryParamsDict(query, {
                            page: 1,
                            offset: 0,
                            size: 20,
                            select: null
                        })
                    )
                })
            );
            const list = yield* ElysiaResponse.JSON(() =>
                response.json<PaginatedList<IssueComment>>()
            );
            return Response.json(list, { status: 200 });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    })
    .patch(
        '/:id',
        ({ params, body, runtime }) => {
            return Effect.gen(function* () {
                const api = yield* ApiClient;
                yield* ElysiaResponse.HTTP(
                    api.patch(`issues/${params.id}`, {
                        body
                    })
                );
                return new Response(null, { status: 204 });
            }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
        },
        {
            body: t.Object({
                patch: t.Object({
                    priority: t.Optional(t.Number()),
                    statusId: t.Optional(t.Number()),
                    statusRank: t.Optional(t.String())
                })
            })
        }
    );
