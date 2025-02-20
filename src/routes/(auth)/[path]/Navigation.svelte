<script lang="ts">
    import NavigationItem from './NavigationItem.svelte';

    interface Props {
        items: {
            href: string;
            icon: SvelteIconComponent;
            activeIcon: SvelteIconComponent;
            label: string;
            child?: Props;
        }[];
    }

    const { items }: Props = $props();
</script>

{#each items as { href, icon, activeIcon, label, child } (href)}
    <li>
        <NavigationItem {href} {icon} {activeIcon} {label} childItems={child?.items} />
    </li>
{/each}
