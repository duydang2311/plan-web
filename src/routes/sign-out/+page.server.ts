import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ cookies }) => {
    // TODO: delete session id
    cookies.delete('plan_session', { path: '/' });
    return redirect(303, '/');
};
