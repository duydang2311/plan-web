import { Effect, pipe } from 'effect';
import { Hono } from 'hono';
import type { IssueComment } from '~/lib/models/issue_comment';
import { ApiClient } from '~/lib/services/api_client.server';
import { requireAuth } from '../middlewares/require_auth';
import { HonoResponse } from '../utils/hono';
import { validator } from '~/lib/utils/validation';
import { paginatedQuery } from '~/lib/utils/url';
import type { PaginatedList } from '~/lib/models/paginatedList';
import { queryParams } from '../utils/url';

export const issues = new Hono()
    .basePath('/issues')
    .use(requireAuth)
    .get('/:id/comments', (c) =>
        pipe(
            Effect.gen(function* () {
                const query = paginatedQuery(
                    queryParams(c, {
                        page: 1,
                        offset: 0,
                        size: 20,
                        select: 'CreatedTime,UpdatedTime,Id,Content,AuthorId'
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
                return c.json(list, 200);
            }),
            Effect.catchAll(Effect.succeed),
            c.var.runtime.runPromise
        )
    )
    .patch('/:id', (c) =>
        pipe(
            Effect.gen(function* () {
                const body = yield* HonoResponse.JSON(() => c.req.json());
                const validation = yield* HonoResponse.Validation(validatePatchIssue(body));
                const api = yield* ApiClient;
                yield* HonoResponse.HTTP(
                    api.patch(`issues/${c.req.param('id')}`, {
                        body: validation.data
                    })
                );
                return c.body(null, 204);
            }),
            Effect.catchAll(Effect.succeed),
            c.var.runtime.runPromise
        )
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
