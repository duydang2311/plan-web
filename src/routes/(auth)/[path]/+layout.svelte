<script lang="ts">
    import { page } from '$app/state';
    import { Resize } from '@cloudinary/url-gen/actions';
    import type { Snippet } from 'svelte';
    import { Avatar, Button, IconButton, Input } from '~/lib/components';
    import Breadcrumb from '~/lib/components/Breadcrumb.svelte';
    import {
        IconChat,
        IconChatOutline,
        IconChevronRight,
        IconCircleDashed,
        IconCircleDashedOutline,
        IconHome,
        IconHomeSolid,
        IconKeyCommandOutline,
        IconPanelLeftClose,
        IconPanelLeftOpen,
        IconProject,
        IconProjectOutline,
        IconResources,
        IconResourcesOutline,
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
    import FriendsButton from './FriendsButton.svelte';
    import Navigation from './Navigation.svelte';
    import NotificationBell from './NotificationBell.svelte';

    const { children, data }: { children: Snippet; data: LayoutData } = $props();
    const { cloudinary } = useRuntime();
    const route = $derived.by(() => {
        const last = page.data.routes?.at(-1);
        if (last?.breadcrumb === true) {
            return last;
        }
    });
    let collapsed = $state.raw(false);
</script>

<svelte:head>
    {#if route}
        <title>{route.meta.title ?? 'Untitled'}</title>
    {/if}
</svelte:head>

<div
    class="min-w-screen bg-base-2 dark:bg-base-1 grid h-full min-h-screen w-full grid-cols-[auto_1fr] p-2"
>
    <div class={['overflow-hidden transition-[max-width]', collapsed ? 'max-w-0' : 'max-w-60']}>
        <aside
            class={[
                'flex min-h-full flex-col items-stretch space-y-4 overflow-auto py-2 pr-2 text-sm'
            ]}
        >
            <div class="text-primary-1 flex select-none items-baseline justify-center gap-1">
                <Logo class="h-4 w-auto" />
                <p class="font-display text-h2 font-black leading-none tracking-tight">coop</p>
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
                <ul class="group font-medium">
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
                                href: `/${page.params['path']}/resources`,
                                icon: IconResourcesOutline,
                                activeIcon: IconResources,
                                label: 'Resources'
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
            <div>
                <ul class="group mb-2 font-medium">
                    <Navigation
                        items={[
                            {
                                href: `/${page.params['path']}/chats`,
                                icon: IconChatOutline,
                                activeIcon: IconChat,
                                label: 'Chat'
                            }
                        ]}
                    />
                </ul>
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
                    <div class="flex flex-col overflow-hidden text-start">
                        <span
                            class="text-base-fg-1 overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                            {data.user.profile?.displayName ?? data.user.email}
                        </span>
                        {#if data.user.profile}
                            <span class="text-base-fg-ghost">{data.user.profile.name}</span>
                        {/if}
                    </div>
                </Button>
            </div>
        </aside>
    </div>
    <div
        class="bg-base-1 dark:bg-base-2 border-base-border-2 shadow-xs grid max-h-[calc(100vh-1rem)] grow grid-rows-[auto_1fr] overflow-hidden rounded-xl border"
    >
        <div class="border-b-base-border-2 flex items-center justify-between gap-2 border-b p-2">
            <div class="flex items-center gap-4">
                <IconButton
                    type="button"
                    variant="base"
                    class="w-fit"
                    onclick={() => {
                        collapsed = !collapsed;
                    }}
                >
                    {#if collapsed}
                        <IconPanelLeftOpen />
                    {:else}
                        <IconPanelLeftClose />
                    {/if}
                </IconButton>
                <Breadcrumb />
            </div>
            <div class="flex items-center gap-2">
                <NotificationBell userId={data.user.id} />
                <FriendsButton userId={data.user.id} />
            </div>
        </div>
        <!-- <div class="transition-enforcement overflow-hidden">
            {#key data.pathname.includes('chats') ? data.pathname
                      .split('/', 3)
                      .join('') : data.pathname}
                <div class="overflow-hidden" in:tsap={pageBlur.in()} out:tsap={pageBlur.out()}>
                    {@render children()}
                </div>
            {/key}
        </div> -->
        <div class="overflow-hidden">
            {@render children()}
        </div>
    </div>
</div>
