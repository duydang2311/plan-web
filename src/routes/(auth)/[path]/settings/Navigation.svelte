<script lang="ts">
    import { browser } from '$app/environment';
    import { beforeNavigate } from '$app/navigation';
    import { page } from '$app/stores';
    import NavigationItem from './NavigationItem.svelte';
    import { gsap } from 'gsap';
    import { Flip } from 'gsap/dist/Flip';

    if (browser) {
        gsap.registerPlugin(Flip);
    }

    const pathname = $derived($page.url.pathname.split('/', 4).join('/'));
    const items = [
        {
            label: 'General',
            href: `/${$page.params['path']}/settings`
        },
        {
            label: 'Status',
            href: `/${$page.params['path']}/settings/status`
        }
    ];
    let activeEl = $state<HTMLElement>();

    beforeNavigate((e) => {
        if (!activeEl || e.willUnload || (e.type !== 'link' && e.type !== 'goto')) return;
        const state = Flip.getState(activeEl, { simple: true });
        e.complete.then(() => {
            if (!activeEl) return;
            console.log(state);
            Flip.from(state, {
                targets: activeEl,
                duration: 0.3,
                absolute: true,
                ease: 'power2.inOut'
            });
        });
    });
</script>

<ul class="flex border-b border-b-base-border px-0 py-0">
    {#each items as { label, href } (href)}
        {@const isActive = href === pathname}
        <li class="relative">
            {#if isActive}
                <!-- <div
                    bind:this={activeEl}
                    class="absolute h-[2px] -bottom-px inset-x-0 bg-base-fg-2"
                    data-flip-id="activeEl"
                ></div> -->
                <div
                    bind:this={activeEl}
                    class="absolute inset-0 bg-base-3"
                    data-flip-id="activeEl"
                ></div>
            {/if}
            <NavigationItem {label} {href} {isActive} />
        </li>
    {/each}
</ul>
