import { error } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import { NotFoundError } from '~/lib/models/errors';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent, params, locals: { runtime } }) => {
    const data = await parent();
    const exit = await Effect.gen(function* () {
        const isId = params.issueId.length === 22;
        if (!isId && isNaN(Number(params.issueId))) {
            return yield* Effect.fail(NotFoundError.instance);
        }

        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(
                isId
                    ? `issues/${params.issueId}`
                    : `projects/${data.project.id}/issues/orderNumber/${params.issueId}`,
                {
                    query: {
                        select: 'Id,Title'
                    }
                }
            )
        );

        if (!response.ok) {
            return yield* Effect.fail({
                status: response.status,
                code: response.status + '',
                message: 'Could not retrieve the requested issue'
            });
        }

        return yield* Effect.tryPromise(() => response.json<{ id: string; title: string }>());
    }).pipe(
        Effect.catchTags({
            UnknownException: () =>
                Effect.fail({
                    status: 500,
                    code: 'unknown',
                    message: 'Could not retrieve the requested issue'
                }),
            NotFoundError: () =>
                Effect.fail({
                    status: 404,
                    code: 'not_found',
                    message: 'Could not retrieve the requested issue'
                })
        }),
        runtime.runPromiseExit
    );

    if (Exit.isFailure(exit)) {
        const { status, ...body } = LoadResponse.Failure(exit);
        return error(status, body);
    }
    return {
        issue: exit.value
    };
};
