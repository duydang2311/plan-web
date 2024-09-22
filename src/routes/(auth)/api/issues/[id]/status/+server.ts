import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { EndpointResponse } from '~/lib/utils/kit';
import { validator } from '~/lib/utils/validation';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async ({ request, params, locals: { runtime } }) => {
    const exit = await runtime.runPromiseExit(
        Effect.gen(function* () {
            const json = yield* EndpointResponse.JSON(() => request.json());
            const validation = yield* EndpointResponse.Validation(validate(json));
            const api = yield* ApiClient;
            yield* EndpointResponse.HTTP(
                api.patch(`issues/${params.id}/status`, {
                    body: {
                        orderByStatus: validation.data.orderByStatus,
                        statusId: validation.data.statusId
                    }
                })
            );
        })
    );

    return Exit.match(exit, {
        onFailure: (cause) =>
            pipe(cause, Cause.failureOption, Option.getOrElse(EndpointResponse.Die)),
        onSuccess: () => new Response(null, { status: 204 })
    });
};

const validate = validator<{ orderByStatus?: number; statusId: number }>((input, { error }) => {
    if (!input || typeof input !== 'object') {
        return error('root', 'object');
    }

    if (!('statusId' in input) || typeof input.statusId !== 'number') {
        return error('statusId', 'number');
    }

    if ('orderByStatus' in input && typeof input.orderByStatus !== 'number') {
        return error('orderByStatus', 'number');
    }
});
