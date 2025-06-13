import { error } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import type { User } from '~/lib/models/user';
import { ApiClient } from '~/lib/services/api_client.server';
import type { Cloudinary } from '~/lib/services/cloudinary.server';
import { urlFromAsset } from '~/lib/utils/cloudinary.server';
import { ActionResponse, LoadResponse } from '~/lib/utils/kit';
import type { Actions, PageServerLoad } from './$types';
import { decodeCreateProfile, validateCreateProfile } from './utils';

export type RemoteUser = Pick<User, 'id' | 'email' | 'profile'>;
export type LocalUser = Omit<RemoteUser, 'profile'> & {
    profile?: {
        name: string;
        displayName: string;
        imageUrl?: string;
    };
};

export const load: PageServerLoad = async ({
    locals: { user, runtime },
    isDataRequest,
    params
}) => {
    if (params.profileName === 'me') {
        const promise = Effect.gen(function* () {
            const response = yield* LoadResponse.HTTP(
                (yield* ApiClient).get(`users/${user.id}`, {
                    query: { select: 'Email,Profile.Name,Profile.DisplayName,Profile.Image' }
                })
            );
            const { email, profile } = yield* LoadResponse.JSON(() =>
                response.json<Omit<RemoteUser, 'id'>>()
            );
            return yield* dataFromRemoteUser({ id: user.id, email, profile });
        }).pipe(
            Effect.orElseSucceed(() => null),
            runtime.runPromise
        );

        return {
            localUser: user,
            user: isDataRequest ? promise : await promise
        };
    }

    const exit = await Effect.gen(function* () {
        const response = yield* LoadResponse.HTTP(
            (yield* ApiClient).get(`users/profile-name/${params.profileName}`, {
                query: { select: 'Id,Email,Profile.Name,Profile.DisplayName,Profile.Image' }
            })
        );
        const user = yield* LoadResponse.JSON(() => response.json<RemoteUser>());

        return yield* dataFromRemoteUser(user);
    }).pipe(runtime.runPromiseExit);

    return {
        localUser: user,
        user: Exit.match(exit, {
            onFailure: () =>
                error(404, { code: 'profile_not_found', message: 'Profile not found' }),
            onSuccess: (user) => user
        })
    };
};

export const actions: Actions = {
    create_profile: ({ request, locals: { runtime } }) => {
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
        }).pipe(Effect.catchAll(Effect.succeed), runtime.runPromise);
    }
};

const dataFromRemoteUser = ({
    id,
    email,
    profile
}: RemoteUser): Effect.Effect<LocalUser, never, Cloudinary> =>
    profile
        ? Effect.gen(function* () {
              const { image, ...rest } = profile;
              const imageUrl = profile.image
                  ? yield* urlFromAsset(profile.image).pipe(Effect.orElseSucceed(() => undefined))
                  : undefined;
              return {
                  id,
                  email,
                  profile: {
                      ...rest,
                      imageUrl
                  }
              };
          })
        : Effect.succeed({ id, email });
