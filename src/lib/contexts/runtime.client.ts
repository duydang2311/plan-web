import { env } from '$env/dynamic/public';
import {
    PUBLIC_REALTIME_PASSWORD,
    PUBLIC_REALTIME_SERVER,
    PUBLIC_REALTIME_USERNAME
} from '$env/static/public';
import { Cloudinary } from '@cloudinary/url-gen';
import defineLazyProperty from 'define-lazy-prop';
import type { Context } from 'effect';
import { getContext, setContext } from 'svelte';
import type { HttpClient } from '../services/http_client';
import { NATSRealtime, type Realtime } from '../services/realtime.client';
import { UniversalHttpClient } from '../services/universal_http_client';
import { type QueryClient, useQueryClient } from '@tanstack/svelte-query';

interface Runtime {
    readonly api: Context.Tag.Service<HttpClient>;
    readonly realtime: Realtime;
    readonly cloudinary: Cloudinary;
    readonly queryClient: QueryClient;
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
        'api',
        () =>
            new UniversalHttpClient({
                baseUrl: `${globalThis.origin}/api`,
                version: 'v1',
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
    defineLazyProperty(runtime, 'queryClient', () => useQueryClient());
    return setContext('runtime', runtime as Runtime);
}

export function useRuntime() {
    return getContext('runtime') as Runtime;
}
