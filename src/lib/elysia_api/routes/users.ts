import { Effect } from 'effect';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';
import { queryParamsDict } from '~/lib/api/utils/url';
import { ApiClient } from '~/lib/services/api_client.server';

export const users = baseApp({ prefix: '/users' })
    .use(requireAuth)
    .get('/search', ({ query, runtime }) => {
        return Effect.gen(function* () {
            const q = queryParamsDict(query, {
                query: null,
                size: 5
            });

            if (!q.query) {
                return new Response(null, { status: 204 });
            }

            const api = yield* ApiClient;
            const response = yield* ElysiaResponse.HTTP(api.get('users/search', { query }));
            const json = yield* ElysiaResponse.JSON(() =>
                response.json<{
                    userId: string;
                    email: string;
                    similarity: number;
                }>()
            );
            return Response.json(json, { status: 200 });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    });
