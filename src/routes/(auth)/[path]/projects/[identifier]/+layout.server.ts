import { error } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { LoadResponse } from '~/lib/utils/kit';
import type { LayoutServerLoad } from './$types';
import { maybeStream } from '~/lib/utils/promise';
import { PermissionService } from '~/lib/services/permission_service.server';

export const load: LayoutServerLoad = async ({
    parent,
    params,
    locals: { runtime },
    isDataRequest
}) => {
    const data = await parent();
    const exit = await runtime.runPromiseExit(
        pipe(
            Effect.gen(function* () {
                const api = yield* ApiClient;
                const response = yield* LoadResponse.HTTP(
                    api.get(
                        `workspaces/${data.workspace.id}/projects/identifier/${params.identifier}`,
                        {
                            query: { select: 'Id,Name,Identifier' }
                        }
                    )
                );
                return yield* LoadResponse.JSON(() =>
                    response.json<{ id: string; name: string; identifier: string }>()
                );
            })
        )
    );

    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        return error(status, body);
    }

    const getProjectPermissions = await Effect.gen(function* () {
        const list = yield* (yield* PermissionService).getProjectPermissions(
            exit.value.id,
            data.user.id
        );
        return new Set(list.items);
    }).pipe(
        Effect.orElseSucceed(() => new Set<string>()),
        runtime.runPromise,
        (a) => maybeStream(a)(isDataRequest)
    );

    return {
        project: exit.value,
        getProjectPermissions: getProjectPermissions()
    };
};
