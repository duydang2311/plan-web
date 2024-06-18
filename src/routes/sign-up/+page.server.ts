import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { timingSafeEqual } from 'crypto';
import { Effect, Either, pipe } from 'effect';
import { ApiError, ValidationError } from '~/lib/models/errors';
import { ApiClientTag } from '~/lib/services/api_client.server';
import { flattenProblemDetails, validateProblemDetailsEffect } from '~/lib/utils/problem_details';
import { extend } from '~/lib/utils/validation';
import type { Actions } from './$types';
import { validate } from './utils';

const serverValidate = extend(validate, async (input, { error }) => {
	if (input.password.length !== input.passwordConfirmation.length) {
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
		error('password', 'confirmed');
		error('passwordConfirmation', 'confirmed');
		return;
	}

	if (!timingSafeEqual(Buffer.from(input.password), Buffer.from(input.passwordConfirmation))) {
		error('password', 'confirmed');
		error('passwordConfirmation', 'confirmed');
	}
});

export const actions = {
	default: async ({ request, locals: { appLive } }) => {
		return pipe(
			await Effect.runPromise(
				Effect.either(
					pipe(
						Effect.gen(function* () {
							const form = yield* Effect.promise(() => request.formData());
							const validated = yield* Effect.promise(() =>
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
											errors: { root: [e.code] }
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
				onRight: (r) => ({ success: true, email: r })
			})
		);
	}
} satisfies Actions;

function signUpEffect(email: string, password: string) {
	return Effect.gen(function* () {
		const apiClient = yield* ApiClientTag;
		const response = yield* apiClient.post('users', {
			body: { email, password, verificationUrl: env.VERIFICATION_URL }
		});
		if (!response.ok) {
			const json = yield* Effect.tryPromise({
				try: () => response.json(),
				catch: () => new ApiError({ code: response.status + '' })
			});
			const problem = yield* validateProblemDetailsEffect(json);
			yield* Effect.fail(
				new ValidationError({
					errors: flattenProblemDetails(problem)
				})
			);
		}
		return yield* Effect.succeed(email);
	});
}
