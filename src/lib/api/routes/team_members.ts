import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import { ApiClient } from '~/lib/services/api_client.server';
import { validator } from '~/lib/utils/validation';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse } from '../utils/hono';

export const teamMembers = new Hono()
    .use(requireAuth)
    .put('/teams/:teamId/members/:memberId/role', (c) =>
        pipe(
            Effect.gen(function* () {
                const body = yield* HonoResponse.JSON(() => c.req.json());
                const validation = yield* HonoResponse.Validation(validateChangeRole(body));
                const api = yield* ApiClient;
                yield* HonoResponse.HTTP(
                    api.put(
                        `teams/${c.req.param('teamId')}/members/${c.req.param('memberId')}/role`,
                        {
                            body: validation.data
                        }
                    )
                );
                return c.body(null, 204);
            }),
            Effect.catchAll(Effect.succeed),
            c.var.runtime.runPromise
        )
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
