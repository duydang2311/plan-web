import * as devalue from 'devalue';
import { Exit } from 'effect';

export function decodeExit<A = never, E = never>(obj: unknown): Exit.Exit<A, E> {
	if (typeof obj === 'object' && obj) {
		if ('_tag' in obj && obj._tag === 'Success' && 'value' in obj) {
			return Exit.succeed<A>(obj.value as A);
		}
		if (
			'_tag' in obj &&
			obj._tag === 'Failure' &&
			'cause' in obj &&
			typeof obj.cause === 'object' &&
			obj.cause &&
			'_tag' in obj.cause &&
			obj.cause._tag === 'Fail' &&
			'failure' in obj.cause
		) {
			return Exit.fail<E>(obj.cause.failure as E);
		}
	}
	throw new Error('Failed to decode Exit');
}
