import { redirect } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import { authenticateOrRefresh } from '~/lib/utils/auth.server';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ cookies, locals: { appLive } }) => {
	const exit = await Effect.runPromiseExit(
		authenticateOrRefresh(cookies).pipe(Effect.provide(appLive))
	);
	if (Exit.isFailure(exit)) {
		redirect(302, '/login');
	}
};
