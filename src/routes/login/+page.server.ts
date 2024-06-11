import { fail, redirect } from '@sveltejs/kit';
import Vine from '@vinejs/vine';
import { Effect, Either, pipe } from 'effect';
import { superValidate } from 'sveltekit-superforms';
import { vine } from 'sveltekit-superforms/adapters';
import { ValidationError } from '~/lib/models/errors';
import { ApiClientTag } from '~/lib/services/api_client.server';
import {
	flattenProblemDetailsErrors,
	parseProblemDetailsEffect
} from '~/lib/utils/problem_details';
import type { Actions, PageServerLoad } from './$types';

interface SignInResponse {
	accessToken: string;
	refreshToken: string;
	accessTokenMaxAge: number;
	refreshTokenMaxAge: number;
}

const schema = Vine.object({
	email: Vine.string().email(),
	password: Vine.string()
});

const defaults = {
	email: '',
	password: ''
};

export const load: PageServerLoad = async () => {
	const form = await superValidate(vine(schema, { defaults }));
	return { form };
};

export const actions = {
	default: async ({ request, cookies, locals: { appLive } }) => {
		return pipe(
			await Effect.runPromise(
				Effect.either(
					pipe(
						Effect.gen(function* () {
							const form = yield* Effect.promise(() =>
								superValidate(request, vine(schema, { defaults }))
							);
							if (!form.valid) {
								yield* Effect.fail(fail(400, { form, errors: undefined }));
							}
							return yield* pipe(
								signInEffect(form.data.email, form.data.password),
								Effect.catchTag('ApiError', (e) =>
									Effect.fail(fail(400, { form, errors: [e.code] }))
								),
								Effect.catchTag('ValidationError', (e) =>
									Effect.fail(fail(400, { form: { ...form, errors: e.errors }, errors: undefined }))
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
