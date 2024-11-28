import { redirect } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse } from '~/lib/utils/kit';
import { stringifyQuery } from '~/lib/utils/url';
import type { Actions } from './$types';
import { decode, validate } from './utils';

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
