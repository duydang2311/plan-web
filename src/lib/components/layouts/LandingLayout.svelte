<script lang="ts">
    import { page } from '$app/state';
    import type { Snippet } from 'svelte';
    import { Button, Logo } from '~/lib/components';
    import { IconLogin } from '~/lib/components/icons';

    const { children }: { children: Snippet } = $props();
</script>

<div>
    <nav class="container mx-auto px-6 py-6">
        <div class="flex items-center justify-between">
            <a href="/" class="flex items-center">
                <Logo class="text-base-fg-1 w-12" />
                <span
                    class="text-base-fg-1 font-display ml-2 text-4xl font-black leading-none tracking-tight"
                >
                    konekt
                </span>
            </a>
            <div class="text-base-fg-5 hidden space-x-8 text-sm md:flex">
                <a href="/" class="hover:text-base-fg-1 transition-colors">Features</a>
                <a href="/" class="hover:text-base-fg-1 transition-colors">Solutions</a>
                <a href="/" class="hover:text-base-fg-1 transition-colors">Templates</a>
                <a href="/" class="hover:text-base-fg-1 transition-colors">Pricing</a>
            </div>
            <div>
                <Button
                    as="link"
                    href="/login"
                    variant="base"
                    outline
                    class="flex items-center gap-2"
                    disabled={page.url.pathname === '/login'}
                >
                    <IconLogin />
                    Sign in
                </Button>
            </div>
        </div>
    </nav>
    <div class="via-base-border-3 h-px bg-gradient-to-r from-transparent to-transparent"></div>
    {@render children()}
</div>
