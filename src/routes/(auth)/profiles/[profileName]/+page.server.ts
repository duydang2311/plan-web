import { error } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import type { User } from '~/lib/models/user';
import { LoadResponse } from '~/lib/utils/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
    locals: { user, runtime },
    fetch,
    isDataRequest,
    params
}) => {
    if (params.profileName === 'me') {
        const promise = Effect.gen(function* () {
            const response = yield* LoadResponse.Fetch(() =>
                fetch(`/api/users/${user.id}?select=Profile.Name,Profile.ImageUrl`, {
                    method: 'get'
                })
            );
            const json = yield* LoadResponse.JSON(() => response.json<Pick<User, 'profile'>>());
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
                `/api/users/profile-name/${params.profileName}?select=Id,Profile.Name,Profile.ImageUrl`,
                {
                    method: 'get'
                }
            )
        );
        const json = yield* LoadResponse.JSON(() => response.json<Pick<User, 'id' | 'profile'>>());
        return json;
    }).pipe(runtime.runPromiseExit);

    return Exit.match(exit, {
        onFailure: () => error(404, { code: 'profile_not_found', message: 'Profile not found' }),
        onSuccess: (a) => ({ profile: a })
    });
};
