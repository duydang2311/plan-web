import { Effect } from 'effect';
import type { IssueComment } from '~/lib/models/issue_comment';
import type { PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { paginatedQuery } from '~/lib/utils/url';
import { validator } from '~/lib/utils/validation';
import { requireAuth } from '../hooks/require_auth';
import { baseApp, ElysiaResponse } from '../utils/elysia';
import { queryParamsDict } from '../utils/url';

export const issues = baseApp({ prefix: '/issues' })
    .use(requireAuth)
    .get('/:id', ({ query, params, runtime }) => {
        return Effect.gen(function* () {
            const response = yield* ElysiaResponse.HTTP(
                (yield* ApiClient).get(`issues/${params.id}`, {
                    query
                })
            );
            const list = yield* ElysiaResponse.JSON(() =>
                response.json<PaginatedList<IssueComment>>()
            );
            return Response.json(list, { status: 200 });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    })
    .get('/:id/comments', ({ query, params, runtime }) => {
        return Effect.gen(function* () {
            const api = yield* ApiClient;
            const response = yield* ElysiaResponse.HTTP(
                api.get(`issues/${params.id}/comments`, {
                    query: paginatedQuery(
                        queryParamsDict(query, {
                            page: 1,
                            offset: 0,
                            size: 20,
                            select: null
                        })
                    )
                })
            );
            const list = yield* ElysiaResponse.JSON(() =>
                response.json<PaginatedList<IssueComment>>()
            );
            return Response.json(list, { status: 200 });
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    })
    .patch(
        '/:id',
        ({ params, body, runtime }) => {
            return Effect.gen(function* () {
                const validation = yield* ElysiaResponse.Validation(validatePatchIssue(body));
                const api = yield* ApiClient;
                yield* ElysiaResponse.HTTP(
                    api.patch(`issues/${params.id}`, {
                        body: validation.data
                    })
                );
                return new Response(null, { status: 204 });
            }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
        },
        { type: 'json' }
    )
    .patch(
        '/:id/status',
        ({ params, body, runtime }) => {
            return Effect.gen(function* () {
                const validation = yield* ElysiaResponse.Validation(validatePatchStatus(body));
                const api = yield* ApiClient;
                yield* ElysiaResponse.HTTP(
                    api.patch(`issues/${params.id}/status`, {
                        body: validation.data
                    })
                );
                return new Response(null, { status: 204 });
            }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
        },
        { type: 'json' }
    );

const validatePatchIssue = validator<{
    patch: {
        priority?: number;
        statusId?: number;
    };
}>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('root', 'object');
    }

    if (!('patch' in input) || !input.patch || typeof input.patch !== 'object') {
        return error('patch', 'object');
    }

    if (
        'priority' in input.patch &&
        (input.patch.priority == null || typeof input.patch.priority !== 'number')
    ) {
        return error('patch.priority', 'number');
    }

    if (
        'statusId' in input.patch &&
        (input.patch.statusId == null || typeof input.patch.statusId !== 'number')
    ) {
        return error('patch.statusId', 'number');
    }
});

const validatePatchStatus = validator<{ orderByStatus?: number; statusId: number }>(
    (input, { error }) => {
        if (!input || typeof input !== 'object') {
            return error('root', 'object');
        }

        if (!('statusId' in input) || typeof input.statusId !== 'number') {
            return error('statusId', 'number');
        }

        if ('orderByStatus' in input && typeof input.orderByStatus !== 'number') {
            return error('orderByStatus', 'number');
        }
    }
);
