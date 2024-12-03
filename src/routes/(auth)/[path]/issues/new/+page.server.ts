import { error, redirect } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import { stringifyQuery } from '~/lib/utils/url';
import type { Actions, PageServerLoad } from './$types';
import { decode, validate } from './utils';

export const load: PageServerLoad = async ({ parent, url, locals: { runtime }, isDataRequest }) => {
    const projectIdentifier = url.searchParams.get('project');
    if (projectIdentifier == null || projectIdentifier.length === 0) {
        return;
    }

    const data = await parent();
    const exitPromise = Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(
                `workspaces/${data.workspace.id}/projects/identifier/${projectIdentifier}`,
                { query: { select: 'Id,Name' } }
            )
        );
        return yield* LoadResponse.JSON(() => response.json<{ id: string; name: string }>());
    }).pipe(runtime.runPromiseExit);

    if (isDataRequest) {
        return {
            page: { project: exitPromise.then((a) => (Exit.isSuccess(a) ? a.value : null)) }
        };
    }

    const exit = await exitPromise;
    if (Exit.isFailure(exit)) {
        const { status, ...body } = pipe(
            exit.cause,
            Cause.failureOption,
            Option.getOrElse(() => Effect.runSync(LoadResponse.UnknownError()))
        );
        return error(status, body);
    }
    return {
        page: { project: exit.value }
    };
};

export const actions: Actions = {
    default: async ({ request, params, url, locals: { runtime } }) => {
        const exit = await Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(validate(decode(formData)));
            const api = yield* ApiClient;
            yield* ActionResponse.HTTP(
                api.post('issues', {
                    body: validation.data
                })
            );
        }).pipe(runtime.runPromiseExit);

        if (Exit.isFailure(exit)) {
            return pipe(
                exit.cause,
                Cause.failureOption,
                Option.getOrElse(() => Effect.runSync(ActionResponse.UnknownError()))
            );
        }

        return redirect(
            302,
            `/${params.path}/issues${stringifyQuery({ team: url.searchParams.get('team'), project: url.searchParams.get('project') }, { includeQuestionMark: true })}`
        );
    }
};
