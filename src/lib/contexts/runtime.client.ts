import {
    PUBLIC_REALTIME_PASSWORD,
    PUBLIC_REALTIME_SERVER,
    PUBLIC_REALTIME_USERNAME
} from '$env/static/public';
import { getContext, setContext } from 'svelte';
import { NATSRealtime, type Realtime } from '../services/realtime.client';
import defineLazyProperty from 'define-lazy-prop';

interface Runtime {
    readonly realtime: Realtime;
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
    return setContext('runtime', runtime as Runtime);
}

export function useRuntime() {
    return getContext('runtime') as Runtime;
}
