import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { EndpointResponse } from '~/lib/utils/kit';
import { validator } from '~/lib/utils/validation';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params, locals: { runtime } }) => {
    const exit = await runtime.runPromiseExit(
        Effect.gen(function* () {
            const body = yield* EndpointResponse.JSON(() => request.json());
            const validation = yield* EndpointResponse.Validation(validate(body));
            const api = yield* ApiClient;
            yield* EndpointResponse.HTTP(
                api.patch(`issues/${params.id}`, {
                    body: validation.data
                })
            );
            return yield* Effect.succeed(new Response(null, { status: 204 }));
        })
    );

    return Exit.match(exit, {
        onFailure: (cause) =>
            pipe(cause, Cause.failureOption, Option.getOrElse(EndpointResponse.Die)),
        onSuccess: (a) => a
    });
};

const validate = validator<{
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
