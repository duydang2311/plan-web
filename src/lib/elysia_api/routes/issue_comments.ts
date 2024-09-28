import { Effect } from 'effect';
import type { IssueComment } from '~/lib/models/issue_comment';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';
import { queryParamsDict } from '../utils/url';

export const issueComments = baseApp({ prefix: '/issue-comments' })
    .use(requireAuth)
    .get('/:id', ({ runtime, query, params }) => {
        return Effect.gen(function* () {
            const api = yield* ApiClient;
            const response = yield* ElysiaResponse.HTTP(
                api.get(`issue-comments/${params.id}`, {
                    query: queryParamsDict(query, { select: null })
                })
            );
            const json = yield* ElysiaResponse.JSON(() => response.json<IssueComment>());
            return Response.json(json, { status: 200 });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    });
