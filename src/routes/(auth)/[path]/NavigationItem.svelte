<script lang="ts">
    import { page } from '$app/state';
    import { melt } from '@melt-ui/svelte';
    import clsx from 'clsx';
    import type { Snippet } from 'svelte';
    import { writable } from 'svelte/store';
    import { IconButton } from '~/lib/components';
    import Collapsible from '~/lib/components/Collapsible.svelte';
    import { IconChevronLeft } from '~/lib/components/icons';
    import { tsap } from '~/lib/utils/transition';
    import Self from './NavigationItem.svelte';

    interface Props {
        href: string;
        icon: SvelteIconComponent;
        activeIcon: SvelteIconComponent;
        label: string;
        children?: Snippet;
        class?: string;
        childItems?: Props[];
    }

    const {
        href,
        icon: Icon,
        activeIcon: ActiveIcon,
        label,
        children,
        childItems,
        ...props
    }: Props = $props();
    const open = writable(false);
    const isActive = $derived(page.url.pathname === href);
</script>

{#if childItems && childItems.length}
    <Collapsible options={{ open }}>
        {#snippet children({ root, content, trigger })}
            <div use:melt={root}>
                <Self {href} icon={Icon} activeIcon={ActiveIcon} {label} class="pr-4">
                    <IconButton
                        type="button"
                        variant="base"
                        class={clsx(
                            'not-hover:not-active:data-[state=open]:bg-transparent absolute right-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
                            isActive && 'text-base-fg-1'
                        )}
                        melt={trigger}
                    >
                        <IconChevronLeft
                            class={clsx('transition', $open && 'text-base-fg-1 -rotate-90')}
                        />
                    </IconButton>
                </Self>
                {#if $open}
                    <ul
                        class="pl-4"
                        in:tsap={(node, gsap) =>
                            gsap.from(node, {
                                height: 0,
                                opacity: 0,
                                duration: 0.2,
                                y: '-0.5rem',
                                ease: 'circ.out',
                                overflow: 'hidden',
                                clearProps: 'overflow,height,opacity'
                            })}
                        out:tsap={(node, gsap) =>
                            gsap.to(node, {
                                height: 0,
                                opacity: 0,
                                duration: 0.2,
                                y: '-0.5rem',
                                overflow: 'hidden',
                                ease: 'circ.in'
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
            'hover:bg-base-fg-1/5 relative flex gap-2 rounded-md transition-[color_background-color_font-weight] duration-75',
            isActive && 'group-[:not(:hover)]:bg-base-fg-1/5 text-base-fg-1 font-bold',
            props.class
        )}
    >
        <a {href} class="font-display flex grow items-center gap-2 p-2">
            <div class="transition-enforcement">
                <ActiveIcon
                    class={clsx('transition-opacity duration-200', !isActive && 'opacity-0')}
                    aria-hidden={!isActive}
                />
                <Icon
                    class={clsx('transition-opacity duration-200', isActive && 'opacity-0')}
                    aria-hidden={isActive}
                />
            </div>
            <span class="font-display whitespace-nowrap">
                {label}
            </span>
        </a>
        {@render children?.()}
    </div>
{/if}
