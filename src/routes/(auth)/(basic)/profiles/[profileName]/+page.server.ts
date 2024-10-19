import { error } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import type { User } from '~/lib/models/user';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import type { Actions, PageServerLoad } from './$types';
import { decodeCreateProfile, validateCreateProfile } from './utils';
import { ApiClient } from '~/lib/services/api_client.server';

export type LocalUser = Pick<User, 'id' | 'profile'>;

export const load: PageServerLoad = async ({
    depends,
    locals: { user, runtime },
    fetch,
    isDataRequest,
    params
}) => {
    depends('fetch:profiles');
    if (params.profileName === 'me') {
        const promise = Effect.gen(function* () {
            const response = yield* LoadResponse.Fetch(() =>
                fetch(`/api/users/${user.id}?select=Profile.Name,Profile.Image`, {
                    method: 'get'
                })
            );
            const json = yield* LoadResponse.JSON(() => response.json<LocalUser>());
            return { ...json, id: user.id };
        }).pipe(
            Effect.catchAll(() => Effect.succeed({ id: user.id })),
            runtime.runPromise
        );
        return {
            profile: isDataRequest ? promise : await promise
        };
    }

    const exit = await Effect.gen(function* () {
        const response = yield* LoadResponse.Fetch(() =>
            fetch(
                `/api/users/profile-name/${params.profileName}?select=Id,Profile.Name,Profile.Image`,
                {
                    method: 'get'
                }
            )
        );
        const json = yield* LoadResponse.JSON(() => response.json<LocalUser>());
        return json;
    }).pipe(runtime.runPromiseExit);

    return Exit.match(exit, {
        onFailure: () => error(404, { code: 'profile_not_found', message: 'Profile not found' }),
        onSuccess: (a) => ({ profile: a })
    });
};

export const actions: Actions = {
    'create-profile': ({ request, locals: { runtime } }) => {
        return Effect.gen(function* () {
            const formData = yield* ActionResponse.FormData(() => request.formData());
            const validation = yield* ActionResponse.Validation(
                validateCreateProfile(decodeCreateProfile(formData))
            );

            const { userId, ...body } = validation.data;
            yield* ActionResponse.HTTP(
                (yield* ApiClient).post(`users/${userId}/profile`, {
                    body
                })
            );
            return { createProfile: { success: true } };
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};
