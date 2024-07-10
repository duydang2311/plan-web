import { ApiClientTag } from '~/lib/services/api_client.server';
import type { LayoutServerLoad } from './$types';
import { Effect, Exit } from 'effect';
import { error } from '@sveltejs/kit';

const pathIdMap = new Map<string, string>();

export const load: LayoutServerLoad = async ({ params, locals: { runtime } }) => {
	const exit = await runtime.runPromiseExit(
		Effect.gen(function* () {
			const apiClient = yield* ApiClientTag;
			const id = pathIdMap.get(params.path);
			let response: Response;
			if (id) {
				response = yield* apiClient.get(`workspaces/${id}`, {
					query: { select: 'new { Id, Name }' }
				});
			} else {
				response = yield* apiClient.get(`workspaces/path/${params.path}`, {
					query: { select: 'new { Id, Name }' }
				});
			}
			if (!response.ok) {
				return yield* Effect.fail<void>(void 0);
			}

			const json = yield* Effect.promise<{ id: string; name: string }>(() => response.json());
			if (!id) {
				pathIdMap.set(params.path, json.id);
			}
			return json;
		})
	);
	if (Exit.isFailure(exit)) {
		return error(404, { message: 'Workspace does not exist', code: 'workspace_not_found' });
	}
	return {
		workspace: exit.value
	};
};
