<script lang="ts">
    import { onMount, type Snippet } from 'svelte';
    import './+layout.css';
    import Toaster from '~/lib/components/Toaster.svelte';
    import { setRuntime } from '~/lib/contexts/runtime.client';
    import { Effect } from 'effect';
    import { Realtime } from '~/lib/services/realtime.client';

    const { children }: { children: Snippet } = $props();
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
            await runtime.runPromiseExit(
                Effect.gen(function* () {
                    const realtime = yield* Realtime;
                    yield* realtime.dispose;
                })
            );
            await runtime.dispose();
        };
    });
</script>

<Toaster />
{@render children()}
