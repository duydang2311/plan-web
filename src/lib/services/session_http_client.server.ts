import type { Cookies } from '@sveltejs/kit';
import type { HttpClientOptions } from './http_client';
import { UniversalHttpClient } from './universal_http_client';

export class SessionHttpClient extends UniversalHttpClient {
    public constructor(
        protected readonly _options: HttpClientOptions & {
            fetch: typeof fetch;
            cookies: Cookies;
        }
    ) {
        super({
            ..._options,
            fetch: _options.fetch
        });
    }

    public async fetch(path: string, init?: RequestInit) {
        const a = await super.fetch(path, {
            ...init,
            headers: {
                ...init?.headers,
                Authorization: `Session ${this._options.cookies.get('plan_session')}`
            }
        });
        if (a.status === 401) {
            this._options.cookies.delete('plan_session', {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/'
            });
        }
        return a;
    }
}
