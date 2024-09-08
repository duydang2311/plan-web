import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { Effect, Exit } from 'effect';
import { EndpointResponse } from '~/lib/utils/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies, url, fetch }) => {
    const exit = await Effect.runPromiseExit(
        Effect.gen(function* () {
            const googleOAuthState = cookies.get('google_oauth_state');
            if (!googleOAuthState) {
                return yield* Effect.fail(
                    json({ errors: ['google_oauth_state'] }, { status: 400 })
                );
            }

            const state = url.searchParams.get('state');
            if (!state || state !== googleOAuthState) {
                return yield* Effect.fail(json({ errors: ['state'] }, { status: 400 }));
            }

            const code = url.searchParams.get('code');
            if (!code) {
                return yield* Effect.fail(json({ errors: ['code'] }, { status: 400 }));
            }

            const response = yield* Effect.tryPromise({
                try: () =>
                    fetch('https://oauth2.googleapis.com/token', {
                        method: 'post',
                        body: JSON.stringify({
                            code: code,
                            client_id: env.GOOGLE_OAUTH_CLIENT_ID,
                            client_secret: env.GOOGLE_OAUTH_CLIENT_SECRET,
                            redirect_uri: `${url.origin}/oauth/google/callback`,
                            grant_type: `authorization_code`
                        }),
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }),
                catch: () => json({ errors: ['fetch'] }, { status: 500 })
            });

            if (!response.ok) {
                return yield* Effect.fail(
                    json({ errors: [response.status + ''] }, { status: response.status })
                );
            }
            return yield* EndpointResponse.JSON(() => response.json());
        })
    );

    if (Exit.isFailure(exit)) {
        return new Response(null, { status: 400 });
    }

    // TODO: handle exit.value payload
    return new Response(null, { status: 302, headers: { Location: '/' } });
};
