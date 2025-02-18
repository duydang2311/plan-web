<script lang="ts">
    import { page } from '$app/state';
    import { gsap } from 'gsap';
    import type { Snippet } from 'svelte';
    import Breadcrumb from '~/lib/components/Breadcrumb.svelte';
    import Logo from '~/lib/components/Logo.svelte';
    import type { LayoutData } from './$types';
    import Navigation from './Navigation.svelte';
    import DynamicNavigation from './DynamicNavigation.svelte';

    const { children, data }: { children: Snippet; data: LayoutData } = $props();
    const route = $derived.by(() => {
        const last = page.data.routes?.at(-1);
        if (last?.breadcrumb === true) {
            return last;
        }
    });

    function transitateIn(node: Element) {
        const tween = gsap.from(node, {
            opacity: 0,
            y: '0.1rem',
            duration: 0.2,
            ease: 'power2.out',
            clearProps: 'y,scale,opacity'
        });
        return {
            duration: tween.totalDuration() * 1000
        };
    }
</script>

<svelte:head>
    {#if route}
        <title>{route.meta.title ?? 'Untitled'}</title>
    {/if}
</svelte:head>

<div class="flex w-full h-full min-w-screen min-h-screen bg-base-2 dark:bg-base-1 lg:p-2 lg:pl-0">
    <aside
        class="items-stretch px-4 py-2 space-y-4 min-w-60 max-w-60 overflow-auto lg:flex lg:flex-col hidden"
    >
        <div class="select-none flex items-center gap-2 font-bold text-base-fg-1">
            <Logo class="h-8 w-auto" />
            <p class="block">plan</p>
        </div>
        <hr class="mx-2 border-base-border-2 border-dashed" />
        <div class="flex flex-col grow gap-4">
            <ul class="font-medium group text-sm">
                <Navigation
                    items={[
                        {
                            href: `/${page.params['path']}`,
                            icon: 'home',
                            activeIcon: 'home-solid',
                            label: 'Home'
                        },
                        {
                            href: `/${page.params['path']}/projects`,
                            icon: 'project-outline',
                            activeIcon: 'project',
                            label: 'Projects'
                        },
                        {
                            href: `/${page.params['path']}/teams`,
                            icon: 'users',
                            activeIcon: 'users-solid',
                            label: 'Teams'
                        }
                    ]}
                />
            </ul>
            <DynamicNavigation />
            <ul class="mt-auto font-medium group text-sm">
                <hr class="border-dashed border-base-border-2 mb-4 mx-2" />
                <Navigation
                    items={[
                        {
                            href: `/${page.params['path']}/settings`,
                            icon: 'settings-outline',
                            activeIcon: 'settings',
                            label: 'Settings',
                            child: {
                                items: [
                                    {
                                        href: `/${page.params['path']}/settings/status`,
                                        icon: 'circle-dashed-outline',
                                        activeIcon: 'circle-dashed',
                                        label: 'Status'
                                    },
                                    {
                                        href: `/${page.params['path']}/settings/members`,
                                        icon: 'users',
                                        activeIcon: 'users-solid',
                                        label: 'Members'
                                    }
                                ]
                            }
                        }
                    ]}
                />
            </ul>
        </div>
    </aside>
    <div
        class="bg-base-1 dark:bg-base-2 grow grid grid-rows-[auto_1fr] max-h-screen lg:rounded-xl lg:border lg:border-base-border-2 lg:max-h-[calc(100vh-1rem)] lg:shadow-sm"
    >
        <Breadcrumb class="px-8 py-2 border-b border-b-base-border-2" />
        <div class="transition-enforcement overflow-hidden">
            {#key data.pathname}
                <div class="overflow-hidden" in:transitateIn>
                    {@render children()}
                </div>
            {/key}
        </div>
    </div>
</div>
