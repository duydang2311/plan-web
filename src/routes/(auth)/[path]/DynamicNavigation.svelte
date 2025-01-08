<script lang="ts">
    import { page } from '$app/state';
    import { tsap } from '~/lib/utils/transition';
    import NavigationItem from './NavigationItem.svelte';

    const routes = $derived<Required<RouteMeta>[] | undefined>(
        page.data.routes
            ?.filter((a) => a.breadcrumb === true && a.meta.navigation != null)
            .map((a) => (a as { meta: Required<RouteMeta> }).meta)
    );
</script>

{#if routes != null && routes.length > 0}
    {#each routes as { href, navigation } (href)}
        <div
            in:tsap|global={(node, gsap) =>
                gsap.from(node, { opacity: 0, y: '-0.5rem', duration: 0.2, ease: 'power2.out' })}
            out:tsap|global={(node, gsap) =>
                gsap.to(node, { opacity: 0, y: '0.5rem', duration: 0.2, ease: 'power2.in' })}
        >
            <h2
                class="text-sm text-base-fg-5 text-ellipsis whitespace-nowrap overflow-hidden"
                title={navigation.label}
            >
                {navigation.label}
            </h2>
            <ul class="mt-1 font-medium group text-sm">
                {#each navigation.entries as { label, href, icon, activeIcon } (href)}
                    <li>
                        <NavigationItem {href} {icon} {activeIcon} {label} />
                    </li>
                {/each}
            </ul>
        </div>
    {/each}
{/if}
