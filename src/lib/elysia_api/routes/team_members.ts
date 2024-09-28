import { Effect } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { validator } from '~/lib/utils/validation';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';

export const teamMembers = baseApp({ prefix: '/users' })
    .use(requireAuth)
    .put(
        '/teams/:teamId/members/:memberId/role',
        ({ params, body, runtime }) => {
            return Effect.gen(function* () {
                const validation = yield* ElysiaResponse.Validation(validateChangeRole(body));
                const api = yield* ApiClient;
                yield* ElysiaResponse.HTTP(
                    api.put(`teams/${params.teamId}/members/${params.memberId}/role`, {
                        body: validation.data
                    })
                );
                return new Response(null, { status: 204 });
            }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
        },
        { type: 'json' }
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
