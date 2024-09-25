import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import type { IssueComment } from '~/lib/models/issue_comment';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse } from '../utils/hono';
import { validator } from 'hono/validator';
import { paginatedQuery } from '~/lib/utils/url';
import type { PaginatedList } from '~/lib/models/paginatedList';

export const issues = new Hono().use(requireAuth).get(
    '/:id/comments',
    validator('query', (query) => {
        const page = Number(query['page']);
        const offset = Number(query['offset']);
        const size = Number(query['size']);
        return {
            page: isNaN(page) ? 1 : page,
            offset: isNaN(offset) ? 0 : offset,
            size: isNaN(size) ? 20 : size,
            select: query['select']?.toString() ?? 'CreatedTime,UpdatedTime,Id,Content,AuthorId'
        };
    }),
    (c) =>
        pipe(
            Effect.gen(function* () {
                const query = paginatedQuery(c.req.valid('query'));
                const api = yield* ApiClient;
                const response = yield* HonoResponse.HTTP(
                    api.get(`issues/${c.req.param('id')}/comments`, {
                        query
                    })
                );
                const list = yield* HonoResponse.JSON(() =>
                    response.json<PaginatedList<IssueComment>>()
                );
                return yield* Effect.succeed(c.json(list, 200));
            }),
            Effect.catchAll((e) => Effect.succeed(e)),
            c.var.runtime.runPromise
        )
);
