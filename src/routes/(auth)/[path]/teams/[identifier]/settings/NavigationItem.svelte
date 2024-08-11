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
        'relative flex items-center px-4 max-xl:py-1 xl:py-2 gap-2 transition-[color_background-color_font-weight] ease-in-out xl:hover:bg-base-3',
        'max-xl:rounded-full',
        isActive
            ? 'font-bold xl:group-[:not(:hover)]:bg-base-3 text-base-fg-1'
            : 'hover:bg-base-fg-1/5'
    )}
>
    <div class="transition-enforcement">
        <Icon
            name={activeIcon}
            class={clsx('transition-opacity ease-in-out duration-200', !isActive && 'opacity-0')}
            aria-hidden={!isActive}
        />
        <Icon
            name={icon}
            class={clsx('transition-opacity ease-in-out duration-200', isActive && 'opacity-0')}
            aria-hidden={isActive}
        />
    </div>
    <span class="hidden md:inline">{label}</span>
</a>
