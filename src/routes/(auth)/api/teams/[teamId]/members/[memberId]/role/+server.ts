import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { RequestHandler } from './$types';
import { EndpointResponse } from '~/lib/utils/kit';
import { ApiClient } from '~/lib/services/api_client.server';
import { validateChangeRole } from './utils';

export const PUT: RequestHandler = async ({ request, params, locals: { runtime } }) => {
    const exit = await runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const data = yield* Effect.tryPromise(() => request.json());
                const validation = validateChangeRole(data);
                if (!validation.ok) {
                    return yield* EndpointResponse.ValidationError(validation.errors);
                }

                const api = yield* ApiClient;
                const response = yield* api.put(
                    `teams/${params.teamId}/members/${params.memberId}/role`,
                    {
                        body: validation.data
                    }
                );

                if (!response.ok) {
                    return yield* EndpointResponse.HTTPError(response);
                }

                return yield* Effect.succeed<void>(void 0);
            }),
            Effect.catchTags({
                ApiError: EndpointResponse.FetchError,
                UnknownException: EndpointResponse.UnknownError
            })
        )
    );

    if (Exit.isFailure(exit)) {
        return pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
    }
    return new Response(null, { status: 204 });
};
