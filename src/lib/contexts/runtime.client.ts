import { page } from '$app/stores';
import {
    PUBLIC_REALTIME_PASSWORD,
    PUBLIC_REALTIME_SERVER,
    PUBLIC_REALTIME_USERNAME
} from '$env/static/public';
import defineLazyProperty from 'define-lazy-prop';
import { getContext, setContext } from 'svelte';
import { get } from 'svelte/store';
import type { HttpClient } from '../services/http_client';
import { NATSRealtime, type Realtime } from '../services/realtime.client';
import { UniversalHttpClient } from '../services/universal_http_client';
import type { Context } from 'effect';
import { Cloudinary } from '@cloudinary/url-gen';
import { env } from '$env/dynamic/public';

interface Runtime {
    readonly httpClient: Context.Tag.Service<HttpClient>;
    readonly realtime: Realtime;
    readonly cloudinary: Cloudinary;
}

export function setRuntime() {
    const runtime = {};
    defineLazyProperty(
        runtime,
        'realtime',
        () =>
            new NATSRealtime({
                servers: PUBLIC_REALTIME_SERVER,
                username: PUBLIC_REALTIME_USERNAME,
                password: PUBLIC_REALTIME_PASSWORD
            })
    );
    defineLazyProperty(
        runtime,
        'httpClient',
        () =>
            new UniversalHttpClient({
                baseUrl: get(page).url.origin,
                fetch: globalThis.fetch
            })
    );
    defineLazyProperty(
        runtime,
        'cloudinary',
        () =>
            new Cloudinary({
                cloud: {
                    cloudName: env.PUBLIC_CLOUDINARY_CLOUD_NAME
                },
                url: { secure: true }
            })
    );
    return setContext('runtime', runtime as Runtime);
}

export function useRuntime() {
    return getContext('runtime') as Runtime;
}
