import { Effect } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { validator } from '~/lib/utils/validation';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';

export const workspaceStatuses = baseApp({ prefix: '/workspace-statuses' })
    .use(requireAuth)
    .patch(
        '/:id',
        ({ params, body, runtime }) => {
            return Effect.gen(function* () {
                const validation = yield* ElysiaResponse.Validation(validatePatch(body));
                yield* ElysiaResponse.HTTP(
                    (yield* ApiClient).patch(`workspace-statuses/${params.id}`, {
                        body: validation.data
                    })
                );
                return new Response(null, { status: 204 });
            }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
        },
        { type: 'json' }
    );

const validatePatch = validator<{ patch: { rank?: number } }>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('$', 'object');
    }

    if (!('patch' in input) || !input.patch || typeof input.patch !== 'object') {
        return error('patch', 'object');
    }

    if ('rank' in input.patch && (!input.patch.rank || typeof input.patch.rank !== 'number')) {
        return error('patch.rank', 'number');
    }
});
