<script lang="ts">
    import clsx from 'clsx';
    import type { IconName } from '~/lib/components/Icon.svelte';
    import Icon from '~/lib/components/Icon.svelte';

    interface Props {
        href: string;
        icon: IconName;
        activeIcon: IconName;
        label: string;
        isActive: boolean;
    }

    const { href, icon, activeIcon, label, isActive }: Props = $props();
</script>

<a
    {href}
    class={clsx(
        'xl:hover:bg-base-3 relative flex items-center gap-2 px-4 transition-[color_background-color_font-weight] max-xl:py-1 xl:py-2',
        'max-xl:rounded-full',
        isActive
            ? 'xl:group-[:not(:hover)]:bg-base-3 text-base-fg-1 font-bold'
            : 'hover:bg-base-fg-1/5'
    )}
>
    <div class="transition-enforcement">
        <Icon
            name={activeIcon}
            class={clsx('transition-opacity', !isActive && 'opacity-0')}
            aria-hidden={!isActive}
        />
        <Icon
            name={icon}
            class={clsx('transition-opacity', isActive && 'opacity-0')}
            aria-hidden={isActive}
        />
    </div>
    <span class="hidden md:inline">{label}</span>
</a>
