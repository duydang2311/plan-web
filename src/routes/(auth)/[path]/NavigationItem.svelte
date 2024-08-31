<script lang="ts">
    import clsx from 'clsx';
    import type { IconName } from '~/lib/components/Icon.svelte';
    import Icon from '~/lib/components/Icon.svelte';
    import type { Snippet } from 'svelte';
    import { page } from '$app/stores';
    import Collapsible from '~/lib/components/Collapsible.svelte';
    import { melt } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { slide } from 'svelte/transition';

    interface Props {
        href: string;
        icon: IconName;
        activeIcon: IconName;
        label: string;
        isActive: boolean;
        inner?: Snippet;
    }

    const { href, icon, activeIcon, label, inner }: Props = $props();
    const isActive = $derived($page.url.pathname === href);
    const open = writable(false);
</script>

{#if label === 'Home'}
    <Collapsible options={{ open }}>
        {#snippet children({ root, content, trigger })}
            <li use:melt={root}>
                <div
                    class={clsx(
                        'relative grow flex justify-between items-center p-2 gap-2 rounded-md transition-[color_background-color_font-weight] ease-in-out hover:bg-base-fg-1/5',
                        isActive && 'font-bold group-[:not(:hover)]:bg-base-fg-1/5 text-base-fg-1'
                    )}
                >
                    <a {href} class="grow flex gap-2 items-center" use:melt={trigger}>
                        <div class="transition-enforcement">
                            <Icon
                                name={activeIcon}
                                class={clsx(
                                    'transition-opacity ease-in-out duration-200',
                                    !isActive && 'opacity-0'
                                )}
                                aria-hidden={!isActive}
                            />
                            <Icon
                                name={icon}
                                class={clsx(
                                    'transition-opacity ease-in-out duration-200',
                                    isActive && 'opacity-0'
                                )}
                                aria-hidden={isActive}
                            />
                        </div>
                        <span class="hidden md:inline">{label}</span>
                    </a>
                    <button type="button" use:melt={trigger}>
                        <Icon name="chevron-left" class="w-5" />
                    </button>
                    {@render inner?.()}
                </div>
            </li>
            {#if $open}
                <div use:melt={content} class="pl-4" transition:slide>
                    <svelte:self
                        href="/{$page.params['path']}/settings/status"
                        icon="settings-outline"
                        activeIcon="settings"
                        label="Status"
                    />
                    <!-- <div class="pl-4" use:melt={content} transition:slide>
                        <Navigation
                            items={[
                                {
                                    href: `/${$page.params['path']}/settings/status`,
                                    icon: 'settings-outline',
                                    activeIcon: 'settings',
                                    label: 'Status'
                                }
                            ]}
                            activeBarClass="-ml-4"
                        />
                    </div> -->
                </div>
            {/if}
        {/snippet}
    </Collapsible>
{:else}
    <li class="relative">
        <a
            {href}
            class={clsx(
                'relative flex items-center p-2 gap-2 rounded-md transition-[color_background-color_font-weight] ease-in-out hover:bg-base-fg-1/5',
                isActive && 'font-bold group-[:not(:hover)]:bg-base-fg-1/5 text-base-fg-1'
            )}
        >
            <div class="transition-enforcement">
                <Icon
                    name={activeIcon}
                    class={clsx(
                        'transition-opacity ease-in-out duration-200',
                        !isActive && 'opacity-0'
                    )}
                    aria-hidden={!isActive}
                />
                <Icon
                    name={icon}
                    class={clsx(
                        'transition-opacity ease-in-out duration-200',
                        isActive && 'opacity-0'
                    )}
                    aria-hidden={isActive}
                />
            </div>
            <span class="hidden md:inline">{label}</span>
            {@render inner?.()}
        </a>
    </li>
{/if}
