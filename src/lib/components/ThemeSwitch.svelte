<script lang="ts">
    import { onMount } from 'svelte';
    import { IconButton } from '.';
    import { IconMonitor, IconMoon, IconSun } from './icons';
    import { watch } from '../utils/runes.svelte';

    type Theme = 'light' | 'dark' | 'system';

    const THEME_KEY = 'theme';
    const themes = ['light', 'dark', 'system'] as const;

    let theme = $state.raw<Theme>();

    const setTheme = (value: (typeof themes)[number]) => {
        theme = value;
        localStorage.setItem(THEME_KEY, value);
        if (value === 'system') {
            value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (document.documentElement.dataset.theme !== value) {
            document.documentElement.dataset.theme = value;
        }
    };

    onMount(() => {
        const saved = localStorage.getItem(THEME_KEY);
        setTheme(saved && themes.includes(saved as Theme) ? (saved as Theme) : 'system');
    });

    watch.pre(() => theme)(() => {
        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => {
                document.documentElement.dataset.theme = window.matchMedia(
                    '(prefers-color-scheme: dark)'
                ).matches
                    ? 'dark'
                    : 'light';
            };
            mediaQuery.addEventListener('change', handler);
            return () => {
                mediaQuery.removeEventListener('change', handler);
            };
        }
    });
</script>

<IconButton type="button" variant="base">
    {#if theme === 'dark'}
        <IconMoon
            onclick={() => {
                setTheme('light');
            }}
        />
    {:else if theme === 'light'}
        <IconSun
            onclick={() => {
                setTheme('system');
            }}
        />
    {:else}
        <IconMonitor
            onclick={() => {
                setTheme('dark');
            }}
        />
    {/if}
</IconButton>
