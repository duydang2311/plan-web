import { fail, redirect } from '@sveltejs/kit';
import { Effect, Either, pipe } from 'effect';
import { ValidationError } from '~/lib/models/errors';
import { ApiClientTag } from '~/lib/services/api_client.server';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import type { Actions } from './$types';
import { validate } from './utils';

interface SignInResponse {
	accessToken: string;
	refreshToken: string;
	accessTokenMaxAge: number;
	refreshTokenMaxAge: number;
}

export const actions = {
	default: async ({ request, cookies, locals: { appLive } }) => {
		return pipe(
			await Effect.runPromise(
				Effect.either(
					pipe(
						Effect.gen(function* () {
							const form = yield* Effect.promise(() => request.formData());
							const validated = yield* Effect.sync(() =>
								validate(Object.fromEntries(form.entries()))
							);
							if (!validated.ok) {
								return yield* Effect.fail(fail(400, { errors: validated.errors }));
							}
							return yield* pipe(
								signInEffect(validated.data.email, validated.data.password),
								Effect.catchTag('ApiError', (e) =>
									Effect.fail(fail(400, { errors: { root: [e.code] } }))
								),
								Effect.catchTag('ValidationError', (e) =>
									Effect.fail(fail(400, { errors: e.errors }))
								)
							);
						}),
						Effect.provide(appLive)
					)
				)
			),
			Either.match({
				onLeft: (l) => l,
				onRight: ({ accessToken, refreshToken, accessTokenMaxAge, refreshTokenMaxAge }) => {
					cookies.set('access_token', accessToken, {
						path: '/',
						httpOnly: true,
						secure: true,
						sameSite: 'strict',
						maxAge: accessTokenMaxAge
					});
					cookies.set('refresh_token', refreshToken, {
						path: '/',
						httpOnly: true,
						secure: true,
						sameSite: 'strict',
						maxAge: refreshTokenMaxAge
					});
					return redirect(302, '/');
				}
			})
		);
	}
} satisfies Actions;

function signInEffect(email: string, password: string) {
	return Effect.gen(function* () {
		const apiClient = yield* ApiClientTag;
		const response = yield* apiClient.post('tokens/authenticate', { body: { email, password } });
		if (!response.ok) {
			const json = yield* Effect.promise(() => response.json<unknown>());
			const problem = yield* pipe(validateProblemDetailsEffect(json));
			yield* Effect.fail(new ValidationError({ errors: flattenProblemDetails(problem) }));
		}
		return yield* Effect.promise(() => response.json<SignInResponse>());
	});
}
