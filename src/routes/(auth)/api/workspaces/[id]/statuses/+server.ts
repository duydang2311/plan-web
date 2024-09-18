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

    if (Exit.isFailure(exit)) {
        return pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
    }
    return exit.value;
};
