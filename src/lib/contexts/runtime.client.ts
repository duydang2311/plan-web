import { Cloudinary } from '@cloudinary/url-gen';
import { type QueryClient } from '@tanstack/svelte-query';
import defineLazyProperty from 'define-lazy-prop';
import type { Context } from 'effect';
import { getContext, setContext } from 'svelte';
import type { HttpClient } from '../services/http_client';
import { type Realtime } from '../services/realtime.client';

interface Runtime {
    readonly api: Context.Tag.Service<HttpClient>;
    readonly realtime: Realtime;
    readonly cloudinary: Cloudinary;
    readonly queryClient: QueryClient;
}

export function setRuntime(value: Record<keyof Runtime, () => Runtime[keyof Runtime]>) {
    const lazy = {};
    for (const k in value) {
        defineLazyProperty(lazy, k, value[k as keyof typeof value]);
    }
    return setContext('runtime', lazy as Runtime);
}

export function useRuntime() {
    return getContext('runtime') as Runtime;
}
