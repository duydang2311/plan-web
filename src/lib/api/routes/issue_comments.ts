import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import type { IssueComment } from '~/lib/models/issue_comment';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse } from '../utils/hono';

export const issueComments = new Hono()
    .basePath('/issue-comments')
    .use(requireAuth)
    .get('/:id', (c) =>
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* HonoResponse.HTTP(
                    api.get(`issue-comments/${c.req.param('id')}`, {
                        query: { select: c.req.query('select') }
                    })
                );
                const json = yield* HonoResponse.JSON(() => response.json<IssueComment>());
                return c.json(json, 200);
            }),
            Effect.catchAll(Effect.succeed),
            c.var.runtime.runPromise
        )
    );
