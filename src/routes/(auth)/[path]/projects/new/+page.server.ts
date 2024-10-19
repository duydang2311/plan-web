import { redirect } from '@sveltejs/kit';
import { Cause, Effect, Exit, Option, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse } from '~/lib/utils/kit';
import type { Actions } from './$types';
import { decode, validate } from './utils';

export const actions: Actions = {
    default: async ({ request, params, locals: { runtime } }) => {
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* ActionResponse.FormData(() => request.formData());
                    const validation = yield* ActionResponse.Validation(validate(decode(formData)));
                    const api = yield* ApiClient;
                    const response = yield* ActionResponse.HTTP(
                        api.post('projects', {
                            body: validation.data
                        })
                    );
                    return yield* ActionResponse.JSON(() =>
                        response.json<{ id: string; identifier: string }>()
                    );
                })
            )
        );

        if (Exit.isFailure(exit)) {
            return pipe(exit.cause, Cause.failureOption, Option.getOrThrow);
        }

        return redirect(302, `/${params.path}/projects/${exit.value.identifier}`);
    }
};
