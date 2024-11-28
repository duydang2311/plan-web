import { Effect } from 'effect';
import { t } from 'elysia';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';

export const teams = baseApp({ prefix: '/teams' })
    .use(requireAuth)
    .get(
        '/',
        ({ query, runtime }) => {
            return Effect.gen(function* () {
                const response = yield* ElysiaResponse.HTTP(
                    (yield* ApiClient).get(`teams`, { query })
                );
                const json = yield* ElysiaResponse.JSON(() => response.json());
                return Response.json(json, { status: response.status });
            }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
        },
        {
            query: t.Object({
                workspaceId: t.Optional(t.String())
            })
        }
    );
