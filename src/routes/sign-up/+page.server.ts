import { fail, redirect } from '@sveltejs/kit';
import { timingSafeEqual } from 'crypto';
import { Effect, Either, pipe } from 'effect';
import { ValidationError } from '~/lib/models/errors';
import { ApiClientTag } from '~/lib/services/api_client.server';
import {
	flattenProblemDetailsErrors,
	parseProblemDetailsEffect
} from '~/lib/utils/problem_details';
import { extend } from '~/lib/utils/validation';
import type { Actions } from './$types';
import { validate } from './utils';

interface SignInResponse {
	accessToken: string;
	refreshToken: string;
	accessTokenMaxAge: number;
	refreshTokenMaxAge: number;
}

const serverValidate = extend(validate, (input, { error }) => {
	const encoder = new TextEncoder();
	const a = encoder.encode(input.password);
	const b = encoder.encode(input.passwordConfirmation);
	if (a.byteLength !== b.byteLength || !timingSafeEqual(a, b)) {
		error('password', 'confirmed');
		error('passwordConfirmation', 'confirmed');
	}
});

export const actions = {
	default: async ({ request, cookies, locals: { appLive } }) => {
		return pipe(
			await Effect.runPromise(
				Effect.either(
					pipe(
						Effect.gen(function* () {
							const form = yield* Effect.promise(() => request.formData());
							const validated = yield* Effect.sync(() =>
								serverValidate(Object.fromEntries(form.entries()))
							);
							if (!validated.ok) {
								return yield* Effect.fail(fail(400, { errors: validated.errors }));
							}
							return yield* pipe(
								signUpEffect(validated.data.email, validated.data.password),
								Effect.catchTag('ApiError', (e) =>
									Effect.fail(
										fail(400, {
											errors: { root: [e.code] } as Record<string, string[]>
										})
									)
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

function signUpEffect(email: string, password: string) {
	return Effect.gen(function* () {
		const apiClient = yield* ApiClientTag;
		const response = yield* apiClient.post('users', { body: { email, password } });
		if (!response.ok) {
			const json = yield* Effect.promise(() => response.json());
			const problem = yield* parseProblemDetailsEffect(json);
			yield* Effect.fail(
				new ValidationError({
					errors: flattenProblemDetailsErrors(problem.errors)
				})
			);
		}
		return yield* Effect.promise(() => response.json<SignInResponse>());
	});
}
