import { redirect } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import type { Issue } from '~/lib/models/issue';
import { paginatedList, type PaginatedList } from '~/lib/models/paginatedList';
import { ApiClientTag } from '~/lib/services/api_client.server';
import { paginatedQuery, queryParams } from '~/lib/utils/url';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({
	url,
	params: { path },
	parent,
	isDataRequest,
	locals: { runtime }
}) => {
	const data = await parent();

	const query = paginatedQuery(
		queryParams(url, {
			page: 1,
			size: 20,
			select: 'new(CreatedTime, UpdatedTime, Id, OrderNumber, Title)',
			order: 'orderNumber'
		})
	);

	const exit = await runtime.runPromiseExit(
		Effect.gen(function* () {
			const api = yield* ApiClientTag;
			const response = yield* api.get('issues', {
				query: { ...query, teamId: data.team.id }
			});

			if (response.status === 403) {
				return yield* Effect.fail<void>(void 0);
			}
			return response;
		})
	);

	if (Exit.isFailure(exit)) {
		return redirect(302, `/${path}`);
	}

	const list = runtime
		.runPromiseExit(
			Effect.gen(function* () {
				if (!exit.value.ok) {
					return yield* Effect.succeed(paginatedList<Issue>());
				}
				return yield* Effect.tryPromise(() => exit.value.json<PaginatedList<Issue>>());
			})
		)
		.then((exit) => (Exit.isFailure(exit) ? paginatedList<Issue>() : exit.value))
		.then((v) => ({ ...v, size: query.size, offset: query.offset }));

	if (Exit.isFailure(exit)) {
		return redirect(302, `/${path}`);
	}

	return {
		issueList: isDataRequest ? list : await list
	};
};
