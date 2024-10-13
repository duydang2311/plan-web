import { Effect } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';
import { queryParamsDict } from '../utils/url';

export const users = baseApp({ prefix: '/users' })
    .use(requireAuth)
    .get('/profile-name/:profileName', ({ params, query, runtime }) => {
        return Effect.gen(function* () {
            const response = yield* ElysiaResponse.HTTP(
                (yield* ApiClient).get(`users/profile-name/${params.profileName}`, { query })
            );
            const json = yield* ElysiaResponse.JSON(() => response.json());
            return Response.json(json, { status: response.status });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    })
    .get('/:id', ({ params, query, runtime }) => {
        return Effect.gen(function* () {
            const response = yield* ElysiaResponse.HTTP(
                (yield* ApiClient).get(`users/${params.id}`, { query })
            );
            const json = yield* ElysiaResponse.JSON(() => response.json());
            return Response.json(json, { status: response.status });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    })
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
