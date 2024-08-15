import { json } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { queryParams } from '~/lib/utils/url';
import type { RequestHandler } from './$types';
import { ApiClient } from '~/lib/services/api_client.server';
import { EndpointResponse } from '~/lib/utils/kit';

export const GET: RequestHandler = async ({ url, locals: { runtime } }) => {
    const query = queryParams(url, { query: '' });
    if (!query) {
        return json(null, { status: 204 });
    }

    const exit = await runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* api.get('users/search', { query });
                if (!response.ok) {
                    return yield* EndpointResponse.HTTPError(response);
                }
                return yield* Effect.tryPromise(() => response.json());
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
    return json(exit.value, { status: 200 });
};
