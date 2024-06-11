import vine, { errors } from '@vinejs/vine';
import { Array, Effect, Record, pipe } from 'effect';
import { ApiError } from '../models/errors';

export interface ProblemDetails {
	type: string;
	title: string;
	status: number;
	detail?: string;
	instance?: string;
	traceId?: string;
	errors?: { name: string; reason: string; code?: string }[];
}

const problemDetailsValidator = vine.compile(
	vine.object({
		type: vine.string(),
		title: vine.string(),
		status: vine.number(),
		detail: vine.string().optional(),
		instance: vine.string().optional(),
		traceId: vine.string().optional(),
		errors: vine
			.array(
				vine.object({
					name: vine.string(),
					reason: vine.string(),
					code: vine.string().optional()
				})
			)
			.optional()
	})
);

export function parseProblemDetailsEffect(input: unknown) {
	return pipe(
		Effect.tryPromise({
			try: () => problemDetailsValidator.validate(input),
			catch: (e) => {
				return e instanceof errors.E_VALIDATION_ERROR
					? new ApiError({
							code: 'problem_details',
							message: e.message
						})
					: new ApiError({
							code: 'problem_details',
							message: 'Unable to pase problem details'
						});
			}
		}),
		Effect.map((a) => a as ProblemDetails)
	);
}

export function flattenProblemDetailsErrors(errors: ProblemDetails['errors']) {
	if (!errors) return {};
	return pipe(
		errors,
		Array.reduce({} as Record<string, string[]>, (acc, cur) => {
			if (!acc[cur.name]) {
				acc[cur.name] = [cur.code ?? cur.reason];
			} else {
				acc[cur.name].push(cur.code ?? cur.reason);
			}
			return acc;
		})
	);
}
