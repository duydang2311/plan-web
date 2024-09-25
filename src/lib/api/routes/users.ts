import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse } from '../utils/hono';

export const users = new Hono()
    .basePath('/users')
    .use(requireAuth)
    .get('/search', (c) =>
        pipe(
            Effect.gen(function* () {
                const query = c.req.query('query');
                if (!query) {
                    return c.json(null, { status: 204 });
                }

                const api = yield* ApiClient;
                const response = yield* HonoResponse.HTTP(
                    api.get('users/search', { query: { query } })
                );
                const json = yield* HonoResponse.JSON(() =>
                    response.json<{
                        userId: string;
                        email: string;
                        similarity: number;
                    }>()
                );
                return c.json(json, 200);
            }),
            Effect.catchAll(Effect.succeed),
            c.var.runtime.runPromise
        )
    );
