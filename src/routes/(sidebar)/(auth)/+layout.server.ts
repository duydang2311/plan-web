import { redirect } from '@sveltejs/kit';
import { Effect, Either, pipe } from 'effect';
import { ApiClientTag } from '~/lib/services/api_client.server';
import type { LayoutServerLoad } from './$types';

interface RefreshTokenResult {
	accessToken: string;
	accessTokenMaxAge: number;
}

export const load: LayoutServerLoad = async ({ cookies, locals: { appLive } }) => {
	return pipe(
		await Effect.gen(function* ($) {
			const accessToken = cookies.get('access_token');
			if (!accessToken) {
				console.log('refreshing');
				const refreshToken = cookies.get('refresh_token');
				if (!refreshToken) {
					return yield* Effect.fail<void>(void 0);
				}

				return yield* $(refreshAccessToken(refreshToken), Effect.provide(appLive));
			}
			return yield* Effect.void;
		}).pipe(Effect.either, Effect.runPromise),
		Either.match({
			onLeft: () => redirect(302, '/login'),
			onRight: (a) => {
				if (a) {
					cookies.set('access_token', a.accessToken, {
						path: '/',
						httpOnly: true,
						secure: true,
						sameSite: 'strict',
						maxAge: a.accessTokenMaxAge
					});
				}
			}
		})
	);
};

function refreshAccessToken(refreshToken: string) {
	return Effect.gen(function* () {
		const apiClient = yield* ApiClientTag;
		const response = yield* apiClient.post('tokens/refresh', { body: { refreshToken } });
		if (response.ok) {
			return yield* Effect.tryPromise(() => response.json<RefreshTokenResult>());
		}
		return yield* Effect.fail<void>(void 0);
	});
}
