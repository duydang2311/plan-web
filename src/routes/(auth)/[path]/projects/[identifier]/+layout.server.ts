import { error } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import type { LayoutServerLoad } from './$types';
import { LoadResponse } from '~/lib/utils/kit';

export const load: LayoutServerLoad = async ({ parent, params, locals: { runtime } }) => {
    const exit = await runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const data = yield* Effect.promise(() => parent());
                const api = yield* ApiClient;
                const response = yield* LoadResponse.HTTP(
                    api.get(`workspaces/${data.workspace.id}/identifier/${params.identifier}`, {
                        query: { select: 'Id' }
                    })
                );
                return yield* LoadResponse.JSON(() => response.json<{ id: string }>());
            })
        )
    );

    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        return error(status, body);
    }

    return {
        project: exit.value
    };
};
