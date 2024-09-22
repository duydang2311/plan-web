import { Cause, Effect, Exit, Option, pipe } from 'effect';
import type { RequestHandler } from './$types';
import { ApiClient } from '~/lib/services/api_client.server';
import { EndpointResponse } from '~/lib/utils/kit';

export const GET: RequestHandler = async ({ params, locals: { runtime } }) => {
    const exit = await runtime.runPromiseExit(
        Effect.gen(function* () {
            const api = yield* ApiClient;
            return yield* EndpointResponse.HTTP(api.get(`workspaces/${params.id}/statuses`));
        })
    );

    return Exit.match(exit, {
        onFailure: (cause) =>
            pipe(cause, Cause.failureOption, Option.getOrElse(EndpointResponse.Die)),
        onSuccess: (a) => a
    });
};
