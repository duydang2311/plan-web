import { Effect } from 'effect';
import { Hono } from 'hono';
import type { IssueComment } from '~/lib/models/issue_comment';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse, success } from '../utils/hono';

export const issueComments = new Hono()
    .basePath('/issue-comments')
    .use(requireAuth)
    .get('/:id', (c) => {
        return Effect.gen(function* () {
            const api = yield* ApiClient;
            const response = yield* HonoResponse.HTTP(
                api.get(`issue-comments/${c.req.param('id')}`, {
                    query: { select: c.req.query('select') }
                })
            );
            const json = yield* HonoResponse.JSON(() => response.json<IssueComment>());
            return c.json(success(json), 200);
        }).pipe(Effect.catchAll(Effect.succeed), c.var.runtime.runPromise);
    });
