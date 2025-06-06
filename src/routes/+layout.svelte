<script lang="ts">
    import { page } from '$app/state';
    import { env } from '$env/dynamic/public';
    import { Cloudinary } from '@cloudinary/url-gen/index';
    import { QueryClientProvider } from '@tanstack/svelte-query';
    import { onMount, type Snippet } from 'svelte';
    import { Sonner, Toaster } from '~/lib/components';
    import { setRuntime } from '~/lib/contexts/runtime.client';
    import { createSignalRHub } from '~/lib/services/hub.client';
    import { NATSRealtime } from '~/lib/services/realtime.client';
    import { UniversalHttpClient } from '~/lib/services/universal_http_client';
    import type { LayoutData } from './$types';
    import './+layout.css';

    const { data, children }: { data: LayoutData; children: Snippet } = $props();
    const getApi = () =>
        new UniversalHttpClient({
            baseUrl: `${page.url.origin}/api`,
            version: 'v1',
            fetch: globalThis.fetch
        });
    const runtime = setRuntime({
        realtime: () =>
            new NATSRealtime({
                servers: env.PUBLIC_REALTIME_SERVER,
                username: env.PUBLIC_REALTIME_USERNAME,
                password: env.PUBLIC_REALTIME_PASSWORD
            }),
        api: getApi,
        cloudinary: () =>
            new Cloudinary({
                cloud: {
                    cloudName: env.PUBLIC_CLOUDINARY_CLOUD_NAME
                },
                url: { secure: true }
            }),
        queryClient: () => data.queryClient,
        hub: () =>
            createSignalRHub(env.PUBLIC_SIGNALR_ORIGIN + '/hub', async () => {
                const api = getApi();
                const response = await api.post('/hubs/token');
                const json = await response.json<{ accessToken: string }>();
                return json.accessToken;
            })
    });

    function onColorSchemePreferenceChange(e: MediaQueryListEvent) {
        if (e.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    onMount(() => {
        const theme = localStorage.getItem('theme');
        if (!theme || theme === 'system') {
            const media = window.matchMedia('(prefers-color-scheme: dark)');
            media.addEventListener('change', onColorSchemePreferenceChange);
            return () => {
                media.removeEventListener('change', onColorSchemePreferenceChange);
            };
        }
        return async () => {
            runtime.realtime.dispose();
        };
    });
</script>

<Toaster />
<Sonner />
<QueryClientProvider client={data.queryClient}>
    {@render children()}
</QueryClientProvider>
