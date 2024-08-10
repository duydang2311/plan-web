<script lang="ts">
    import { QueryClientProvider } from '@tanstack/svelte-query';
    import { onMount, type Snippet } from 'svelte';
    import Toaster from '~/lib/components/Toaster.svelte';
    import { setRuntime } from '~/lib/contexts/runtime.client';
    import type { LayoutData } from './$types';
    import './+layout.css';

    const { data, children }: { data: LayoutData; children: Snippet } = $props();
    const runtime = setRuntime();

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
<QueryClientProvider client={data.queryClient}>
    {@render children()}
</QueryClientProvider>
