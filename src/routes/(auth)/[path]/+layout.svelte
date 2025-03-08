<script lang="ts">
    import { page } from '$app/state';
    import { Resize } from '@cloudinary/url-gen/actions';
    import { gsap } from 'gsap';
    import type { Snippet } from 'svelte';
    import { Avatar, Button, Input } from '~/lib/components';
    import Breadcrumb from '~/lib/components/Breadcrumb.svelte';
    import {
        IconCircleDashed,
        IconCircleDashedOutline,
        IconHome,
        IconHomeSolid,
        IconKeyCommandOutline,
        IconProject,
        IconProjectOutline,
        IconSearch,
        IconSettings,
        IconSettingsOutline,
        IconUsers,
        IconUsersSolid
    } from '~/lib/components/icons';
    import Logo from '~/lib/components/Logo.svelte';
    import { useRuntime } from '~/lib/contexts/runtime.client';
    import { imageFromAsset } from '~/lib/utils/cloudinary';
    import type { LayoutData } from './$types';
    import DynamicNavigation from './DynamicNavigation.svelte';
    import Navigation from './Navigation.svelte';
    import NotificationBell from './NotificationBell.svelte';
    import { pageBlur, tsap } from '~/lib/utils/transition';

    const { children, data }: { children: Snippet; data: LayoutData } = $props();
    const { cloudinary } = useRuntime();
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
        <div class="text-primary-1 flex select-none items-center justify-center gap-2">
            <Logo class="h-6 w-auto" />
            <p class="font-display text-title font-black tracking-tight">Keptrack</p>
        </div>
        <div class="relative">
            <Input placeholder="Search..." class="py-1 pl-8 pr-12" />
            <IconSearch class="text-base-fg-5 absolute left-2 top-1/2 -translate-y-1/2" />
            <div
                class="text-base-fg-1 bg-base-5 absolute right-2 top-1/2 flex -translate-y-1/2 select-none items-center gap-0 rounded-sm px-1 text-sm"
            >
                <IconKeyCommandOutline />
                <span class="font-display">K</span>
            </div>
        </div>
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
                        },
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
            <DynamicNavigation />
        </div>
        <Button
            as="link"
            href="/profiles/me"
            variant="base"
            filled={false}
            class="flex items-center gap-2 px-2 text-sm font-medium"
        >
            <Avatar
                src={imageFromAsset(cloudinary)(data.user.profile?.image)
                    ?.resize(Resize.fill(64))
                    .toURL()}
                seed={data.user.profile?.name ?? data.user.email}
                class="size-10"
            />
            <div class="grid grid-rows-2 text-start">
                <span class="text-base-fg-1 overflow-hidden text-ellipsis whitespace-nowrap">
                    {data.user.profile?.displayName ?? data.user.email}
                </span>
                {#if data.user.profile}
                    <span class="text-base-fg-ghost">{data.user.profile.name}</span>
                {/if}
            </div>
        </Button>
    </aside>
    <div
        class="bg-base-1 dark:bg-base-2 lg:border-base-border-2 lg:shadow-xs grid max-h-screen grow grid-rows-[auto_1fr] overflow-hidden lg:max-h-[calc(100vh-1rem)] lg:rounded-xl lg:border"
    >
        <div
            class="border-b-base-border-2 flex items-center justify-between gap-2 border-b px-8 py-2"
        >
            <Breadcrumb />
            <NotificationBell userId={data.user.id} />
        </div>
        <div class="transition-enforcement overflow-hidden">
            {#key data.pathname}
                <div class="overflow-hidden" in:tsap={pageBlur.in()} out:tsap={pageBlur.out()}>
                    {@render children()}
                </div>
            {/key}
        </div>
    </div>
</div>
