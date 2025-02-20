<script lang="ts">
    import { page } from '$app/state';
    import { gsap } from 'gsap';
    import type { Snippet } from 'svelte';
    import Breadcrumb from '~/lib/components/Breadcrumb.svelte';
    import {
        IconCircleDashed,
        IconCircleDashedOutline,
        IconHome,
        IconHomeSolid,
        IconProject,
        IconProjectOutline,
        IconSettings,
        IconSettingsOutline,
        IconUsers,
        IconUsersSolid
    } from '~/lib/components/icons';
    import Logo from '~/lib/components/Logo.svelte';
    import type { LayoutData } from './$types';
    import DynamicNavigation from './DynamicNavigation.svelte';
    import Navigation from './Navigation.svelte';

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

<div class="min-w-screen bg-base-2 dark:bg-base-1 flex h-full min-h-screen w-full lg:p-2 lg:pl-0">
    <aside
        class="hidden min-w-60 max-w-60 items-stretch space-y-4 overflow-auto px-4 py-2 lg:flex lg:flex-col"
    >
        <div class="text-base-fg-1 flex select-none items-center gap-2 font-bold">
            <Logo class="h-8 w-auto" />
            <p class="block">plan</p>
        </div>
        <hr class="border-base-border-2 mx-2 border-dashed" />
        <div class="flex grow flex-col gap-4">
            <ul class="group text-sm font-medium">
                <Navigation
                    items={[
                        {
                            href: `/${page.params['path']}`,
                            icon: IconHome,
                            activeIcon: IconHomeSolid,
                            label: 'Home'
                        },
                        {
                            href: `/${page.params['path']}/projects`,
                            icon: IconProjectOutline,
                            activeIcon: IconProject,
                            label: 'Projects'
                        },
                        {
                            href: `/${page.params['path']}/teams`,
                            icon: IconUsers,
                            activeIcon: IconUsersSolid,
                            label: 'Teams'
                        }
                    ]}
                />
            </ul>
            <DynamicNavigation />
            <ul class="group mt-auto text-sm font-medium">
                <hr class="border-base-border-2 mx-2 mb-4 border-dashed" />
                <Navigation
                    items={[
                        {
                            href: `/${page.params['path']}/settings`,
                            icon: IconSettingsOutline,
                            activeIcon: IconSettings,
                            label: 'Settings',
                            child: {
                                items: [
                                    {
                                        href: `/${page.params['path']}/settings/status`,
                                        icon: IconCircleDashedOutline,
                                        activeIcon: IconCircleDashed,
                                        label: 'Status'
                                    },
                                    {
                                        href: `/${page.params['path']}/settings/members`,
                                        icon: IconUsers,
                                        activeIcon: IconUsersSolid,
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
        class="bg-base-1 dark:bg-base-2 lg:border-base-border-2 grid max-h-screen grow grid-rows-[auto_1fr] lg:max-h-[calc(100vh-1rem)] lg:rounded-xl lg:border lg:shadow-sm"
    >
        <Breadcrumb class="border-b-base-border-2 border-b px-8 py-2" />
        <div class="transition-enforcement overflow-hidden">
            {#key data.pathname}
                <div class="overflow-hidden" in:transitateIn>
                    {@render children()}
                </div>
            {/key}
        </div>
    </div>
</div>
