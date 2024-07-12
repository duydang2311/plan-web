import { ApiClientTag } from '~/lib/services/api_client.server';
import type { LayoutServerLoad } from './$types';
import { Effect, Exit } from 'effect';
import { error } from '@sveltejs/kit';

const identifierIdMap = new Map<string, string>();

export const load: LayoutServerLoad = async ({
	params: { identifier },
	locals: { runtime },
	parent
}) => {
	const exit = await runtime.runPromiseExit(
		Effect.gen(function* () {
			const apiClient = yield* ApiClientTag;
			const id = identifierIdMap.get(identifier);
			let response: Response;
			if (id) {
				response = yield* apiClient.get(`teams/${id}`, {
					query: { select: 'new(Id, Name)' }
				});
			} else {
				const data = yield* Effect.promise(() => parent());
				response = yield* apiClient.get(
					`workspaces/${data.workspace.id}/teams/identifier/${identifier}`,
					{
						query: { select: 'new(Id, Name)' }
					}
				);
			}

			if (!response.ok) {
				return yield* Effect.fail<void>(void 0);
			}

			const json = yield* Effect.promise<{ id: string; name: string }>(() => response.json());
			if (!id) {
				identifierIdMap.set(identifier, json.id);
			}
			return json;
		})
	);
	if (Exit.isFailure(exit)) {
		return error(404, { message: 'Team does not exist', code: 'team_not_found' });
	}
	return {
		team: exit.value
	};
};
