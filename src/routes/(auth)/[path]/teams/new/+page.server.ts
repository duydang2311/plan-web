import { redirect } from '@sveltejs/kit';
import { Effect, Exit, pipe } from 'effect';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse } from '~/lib/utils/kit';
import type { Actions } from './$types';
import { decode, validate } from './utils';

export const actions: Actions = {
    default: async ({ request, locals: { runtime }, params }) => {
        const exit = await runtime.runPromiseExit(
            pipe(
                Effect.gen(function* () {
                    const formData = yield* ActionResponse.FormData(() => request.formData());
                    const validation = yield* ActionResponse.Validation(validate(decode(formData)));
                    const response = yield* ActionResponse.HTTP(
                        (yield* ApiClient).post(`teams`, {
                            body: validation.data
                        })
                    );
                    return yield* ActionResponse.JSON(() =>
                        response.json<{ id: string; identifier: string }>()
                    );
                })
            )
        );

        return exit.pipe(
            Exit.match({
                onFailure: ActionResponse.Failure,
                onSuccess: (a) => redirect(302, `/${params.path}/teams/${a.identifier}`)
            })
        );
    }
};
