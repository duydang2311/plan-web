import { LoadAttempt } from '~/lib/utils/kit';
import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals, cookies }) => {
    const verifyAttempt = await LoadAttempt.HTTP(() =>
        locals.api.post(`users/verify/${params.token}`)
    );
    LoadAttempt.Assert(verifyAttempt);

    if (!verifyAttempt.data.ok) {
        return error(verifyAttempt.data.status, {
            code: 'verification_failed',
            message: verifyAttempt.data.statusText
        });
    }

    cookies.set('flash_verified', 'true', {
        path: '/',
        httpOnly: true,
        maxAge: 60
    });
    return redirect(303, '/login');
};
