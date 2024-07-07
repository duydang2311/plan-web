import { ApiClientTag } from '~/lib/services/api_client.server';
import type { LayoutServerLoad } from './$types';
import { Effect, Exit } from 'effect';
import { error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ params, locals: { runtime } }) => {
	const exit = await runtime.runPromiseExit(
		Effect.gen(function* () {
			const apiClient = yield* ApiClientTag;
			const response = yield* apiClient.head('workspaces', {
				query: { path: params.path }
			});
			if (!response.ok) {
				return yield* Effect.fail<void>(void 0);
			}
		})
	);
	if (Exit.isFailure(exit)) {
		error(404, { message: 'Workspace does not exist', code: 'workspace_not_found' });
	}
};
