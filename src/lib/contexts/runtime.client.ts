import {
    PUBLIC_REALTIME_PASSWORD,
    PUBLIC_REALTIME_SERVER,
    PUBLIC_REALTIME_USERNAME
} from '$env/static/public';
import { Layer, ManagedRuntime } from 'effect';
import { getContext, setContext } from 'svelte';
import { NATSRealtime, Realtime } from '../services/realtime.client';

const RealtimeLive = Layer.sync(
    Realtime,
    () =>
        new NATSRealtime({
            servers: PUBLIC_REALTIME_SERVER,
            username: PUBLIC_REALTIME_USERNAME,
            password: PUBLIC_REALTIME_PASSWORD
        })
);

const runtime = ManagedRuntime.make(RealtimeLive);

export function setRuntime() {
    return setContext('runtime', runtime);
}

export function useRuntime() {
    return getContext('runtime') as typeof runtime;
}
