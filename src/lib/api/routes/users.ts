import { Effect } from 'effect';
import { Hono } from 'hono';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse, success } from '../utils/hono';
import { validator } from 'hono/validator';
import { D } from '@mobily/ts-belt';
import { queryParamsDict } from '../utils/url';

export const users = new Hono()
    .basePath('/users')
    .use(requireAuth)
    .get(
        '/search',
        validator('query', (query) => {
            const q = D.selectKeys(query, ['query', 'size']);
            return q as Partial<typeof q>;
        }),
        (c) => {
            return Effect.gen(function* () {
                const query = queryParamsDict(c.req.valid('query'), {
                    query: null,
                    size: 5
                });

                if (!query.query) {
                    return c.json(null, 204);
                }

                const api = yield* ApiClient;
                const response = yield* HonoResponse.HTTP(api.get('users/search', { query }));
                const json = yield* HonoResponse.JSON(() =>
                    response.json<{
                        userId: string;
                        email: string;
                        similarity: number;
                    }>()
                );
                return c.json(success(json), 200);
            }).pipe(Effect.catchAll(Effect.succeed), c.var.runtime.runPromise);
        }
    );
