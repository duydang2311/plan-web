import { error, json } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { IssueComment } from '~/lib/models/issue_comment';
import { ApiClient } from '~/lib/services/api_client.server';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { queryParams } from '~/lib/utils/url';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, params, locals: { runtime } }) => {
    const query = queryParams(url, {
        select: null
    });
    const exit = await runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get(`issue-comments/${params.id}`, { query });
                if (!response.ok) {
                    if (response.status === 400) {
                        const json = yield* Effect.tryPromise(() => response.json());
                        const problemDetails = yield* validateProblemDetailsEffect(json);
                        return yield* Effect.fail({
                            status: 400,
                            code: problemDetails.type,
                            message: problemDetails.title,
                            errors: flattenProblemDetails(problemDetails)
                        });
                    }
                    return yield* Effect.fail({
                        status: response.status,
                        code: response.status + '',
                        message: response.statusText
                    });
                }
                return yield* Effect.tryPromise(() => response.json<IssueComment>());
            }),
            Effect.catchTags({
                ApiError: (e) => Effect.fail({ status: 500, code: e.code, message: e.message }),
                UnknownException: () =>
                    Effect.fail({
                        status: 500,
                        code: 'unknown',
                        message: 'An unknown problem occurred'
                    })
            })
        )
    );

    if (Exit.isFailure(exit)) {
        const { status, ...data } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        return error(status, data);
    }
    return json(exit.value, { status: 200 });
};
