import { error } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import type { User } from '~/lib/models/user';
import { ApiClient } from '~/lib/services/api_client.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import type { Actions, PageServerLoad } from './$types';
import { decodeCreateProfile, validateCreateProfile } from './utils';

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
            Effect.catchAll(() => Effect.succeed(null)),
            runtime.runPromise
        );

        return {
            user: isDataRequest ? promise : await promise
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
        return yield* LoadResponse.JSON(() => response.json<LocalUser>());
    }).pipe(runtime.runPromiseExit);

    return Exit.match(exit, {
        onFailure: () => error(404, { code: 'profile_not_found', message: 'Profile not found' }),
        onSuccess: (user) => ({ user })
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
