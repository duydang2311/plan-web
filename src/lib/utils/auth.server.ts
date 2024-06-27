import type { Cookies } from '@sveltejs/kit';
import { Effect } from 'effect';
import { ApiClientTag } from '../services/api_client.server';

export const authenticateOrRefresh = (cookies: Cookies) =>
	Effect.gen(function* () {
		const accessToken = cookies.get('access_token');
		if (!accessToken) {
			const refreshToken = cookies.get('refresh_token');
			if (!refreshToken) {
				return yield* Effect.fail<void>(void 0);
			}

			return yield* refresh(cookies);
		}
		return yield* Effect.succeed({ accessToken });
	});

export const refresh = (cookies: Cookies) =>
	Effect.gen(function* () {
		const refreshToken = cookies.get('refresh_token');
		if (!refreshToken) {
			return yield* Effect.fail<void>(void 0);
		}

		const apiClient = yield* ApiClientTag;
		const response = yield* apiClient.post('tokens/refresh', { body: { refreshToken } });
		if (response.ok) {
			const result = yield* Effect.tryPromise(() =>
				response.json<{
					accessToken: string;
					accessTokenMaxAge: number;
				}>()
			);
			cookies.set('access_token', result.accessToken, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: result.accessTokenMaxAge
			});
			return yield* Effect.succeed({ accessToken: result.accessToken });
		}
		return yield* Effect.fail<void>(void 0);
	});
