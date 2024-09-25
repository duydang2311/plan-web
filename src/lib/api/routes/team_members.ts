import { Effect } from 'effect';
import { Hono, type Context } from 'hono';
import { validator as honoValidator } from 'hono/validator';
import { ApiClient } from '~/lib/services/api_client.server';
import { validator } from '~/lib/utils/validation';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse } from '../utils/hono';
import type { Environment } from '../server';

export const teamMembers = new Hono().use(requireAuth).put(
    '/teams/:teamId/members/:memberId/role',
    honoValidator('json', (body, c: Context<Environment>) => {
        return HonoResponse.Validation(validateChangeRole(body)).pipe(
            Effect.map((a) => a.data),
            Effect.catchAll(Effect.succeed),
            c.var.runtime.runSync
        );
    }),
    (c) => {
        return Effect.gen(function* () {
            const body = c.req.valid('json');
            const api = yield* ApiClient;
            yield* HonoResponse.HTTP(
                api.put(`teams/${c.req.param('teamId')}/members/${c.req.param('memberId')}/role`, {
                    body
                })
            );
            return c.body(null, 204);
        }).pipe(Effect.catchAll(Effect.succeed), c.var.runtime.runPromise);
    }
);

const validateChangeRole = validator<{ roleName: string }>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('root', 'object');
    }

    if (!('roleName' in input) || !input.roleName || typeof input.roleName !== 'string') {
        return error('roleName', 'invalid');
    }

    if (
        input.roleName !== 'Administrator' &&
        input.roleName !== 'Manager' &&
        input.roleName !== 'Member' &&
        input.roleName !== 'Guest'
    ) {
        return error('roleName', 'invalid');
    }
});
