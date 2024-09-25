import { Effect } from 'effect';
import { Hono, type Context } from 'hono';
import { validator as hv } from 'hono/validator';
import type { IssueComment } from '~/lib/models/issue_comment';
import type { PaginatedList } from '~/lib/models/paginatedList';
import { ApiClient } from '~/lib/services/api_client.server';
import { paginatedQuery } from '~/lib/utils/url';
import { validator } from '~/lib/utils/validation';
import { requireAuth } from '../middlewares/require_auth';
import type { Environment } from '../server';
import { HonoResponse, success } from '../utils/hono';
import { queryParams } from '../utils/url';

export const issues = new Hono()
    .basePath('/issues')
    .use(requireAuth)
    .get(
        '/:id/comments',
        hv('query', () => {
            return {} as {
                page?: number;
                offset?: number;
                size?: number;
                select?: string;
            };
        }),
        (c) => {
            return Effect.gen(function* () {
                const query = paginatedQuery(
                    queryParams(c, {
                        page: 1,
                        offset: 0,
                        size: 20,
                        select: null
                    })
                );
                const api = yield* ApiClient;
                const response = yield* HonoResponse.HTTP(
                    api.get(`issues/${c.req.param('id')}/comments`, {
                        query
                    })
                );
                const list = yield* HonoResponse.JSON(() =>
                    response.json<PaginatedList<IssueComment>>()
                );
                return c.json(success(list), 200);
            }).pipe(Effect.catchAll(Effect.succeed), c.var.runtime.runPromise);
        }
    )
    .patch(
        '/:id',
        hv('json', (body, c: Context<Environment>) => {
            return HonoResponse.Validation(validatePatchIssue(body)).pipe(
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
                    api.patch(`issues/${c.req.param('id')}`, {
                        body
                    })
                );
                return c.body(null, 204);
            }).pipe(Effect.catchAll(Effect.succeed), c.var.runtime.runPromise);
        }
    )
    .patch(
        '/:id/status',
        hv('json', (body, c: Context<Environment>) => {
            return HonoResponse.Validation(validatePatchStatus(body)).pipe(
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
                    api.patch(`issues/${c.req.param('id')}/status`, {
                        body
                    })
                );
                return c.body(null, 204);
            }).pipe(Effect.catchAll(Effect.succeed), c.var.runtime.runPromise);
        }
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
