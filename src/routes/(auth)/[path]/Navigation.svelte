<script lang="ts">
    import type { IconName } from '~/lib/components/Icon.svelte';
    import NavigationItem from './NavigationItem.svelte';

    interface Props {
        items: {
            href: string;
            icon: IconName;
            activeIcon: IconName;
            label: string;
            child?: Props;
        }[];
    }

    const { items }: Props = $props();
</script>

{#each items as { href, icon, activeIcon, label, child } (href)}
    <NavigationItem {href} {icon} {activeIcon} {label} childItems={child?.items} />
{/each}
