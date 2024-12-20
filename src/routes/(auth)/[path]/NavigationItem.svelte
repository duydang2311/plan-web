<script lang="ts">
    import { page } from '$app/state';
    import clsx from 'clsx';
    import type { Snippet } from 'svelte';
    import type { IconName } from '~/lib/components/Icon.svelte';
    import Icon from '~/lib/components/Icon.svelte';
    import Collapsible from '~/lib/components/Collapsible.svelte';
    import { melt } from '@melt-ui/svelte';
    import { writable } from 'svelte/store';
    import { IconButton } from '~/lib/components';
    import { tsap } from '~/lib/utils/transition';
    import Self from './NavigationItem.svelte';

    interface Props {
        href: string;
        icon: IconName;
        activeIcon: IconName;
        label: string;
        children?: Snippet;
        class?: string;
        childItems?: Props[];
    }

    const { href, icon, activeIcon, label, children, childItems, ...props }: Props = $props();
    const open = writable(false);
    const isActive = $derived(page.url.pathname === href);
</script>

{#if childItems && childItems.length}
    <Collapsible options={{ open }}>
        {#snippet children({ root, content, trigger })}
            <div use:melt={root}>
                <Self {href} {icon} {activeIcon} {label} class="pl-8">
                    <IconButton
                        type="button"
                        variant="base"
                        class={clsx(
                            'absolute left-2 top-1/2 -translate-y-1/2',
                            isActive && 'text-base-fg-1'
                        )}
                        melt={trigger}
                    >
                        <Icon
                            name="chevron-right"
                            class={clsx(
                                'transition ease-in-out',
                                $open && 'rotate-90 text-base-fg-1'
                            )}
                        />
                    </IconButton>
                </Self>
                {#if $open}
                    <ul
                        class="pl-8"
                        in:tsap={(node, gsap) =>
                            gsap.from(node, {
                                height: 0,
                                opacity: 0,
                                duration: 0.2,
                                ease: 'power1.inOut',
                                clearProps: 'height, opacity'
                            })}
                        out:tsap={(node, gsap) =>
                            gsap.to(node, {
                                height: 0,
                                opacity: 0,
                                duration: 0.2,
                                ease: 'power1.inOut'
                            })}
                        use:melt={content}
                    >
                        {#each childItems as item (item.href)}
                            <li>
                                <Self {...item} />
                            </li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/snippet}
    </Collapsible>
{:else}
    <div
        class={clsx(
            'relative flex gap-2 rounded-md transition-[color_background-color_font-weight] ease-in-out duration-75 hover:bg-primary-1/5',
            isActive && 'font-bold group-[:not(:hover)]:bg-primary-1/5 text-primary-1',
            props.class
        )}
    >
        <a {href} class="grow flex p-2 items-center gap-2 font-display">
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
            <span class="font-display">{label}</span>
        </a>
        {@render children?.()}
    </div>
{/if}
