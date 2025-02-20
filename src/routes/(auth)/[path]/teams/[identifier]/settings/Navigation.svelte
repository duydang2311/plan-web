<script lang="ts">
    import { browser } from '$app/environment';
    import { beforeNavigate } from '$app/navigation';
    import { page } from '$app/state';
    import gsap from 'gsap';
    import Flip from 'gsap/dist/Flip';
    import NavigationItem from './NavigationItem.svelte';

    interface Props {
        items: {
            href: string;
            icon: SvelteIconComponent;
            activeIcon: SvelteIconComponent;
            label: string;
        }[];
    }

    const { items }: Props = $props();
    const pathname = $derived(page.url.pathname.split('/', 6).join('/'));
    let activeBar = $state<HTMLDivElement>();

    if (browser) {
        gsap.registerPlugin(Flip);
    }

    beforeNavigate(({ willUnload, complete }) => {
        if (willUnload) return;
        if (activeBar) {
            const state = Flip.getState(activeBar, { simple: true });
            complete.then(() => {
                if (activeBar) {
                    Flip.from(state, {
                        targets: activeBar,
                        duration: 0.3,
                        prune: true,
                        ease: 'power2.inOut'
                    });
                }
            });
        } else {
            complete.then(() => {
                if (activeBar) {
                    gsap.from(activeBar!, {
                        opacity: 0,
                        scaleY: 0,
                        duration: 0.2,
                        prune: true,
                        ease: 'power2.inOut'
                    });
                }
            });
        }
    });
</script>

<ul class="group text-sm font-medium max-xl:flex max-xl:gap-2 xl:min-w-36">
    {#each items as { href, icon, activeIcon, label } (href)}
        {@const isActive = pathname === href}
        <li class="relative">
            {#if isActive}
                <div
                    bind:this={activeBar}
                    class="max-xl:bg-base-3 xl:bg-base-fg-1 absolute max-xl:inset-0 max-xl:rounded-full xl:inset-y-0 xl:left-0 xl:z-50 xl:w-0.5"
                    data-flip-id="active-bar"
                ></div>
            {/if}
            <NavigationItem {href} {isActive} {icon} {activeIcon} {label} />
        </li>
    {/each}
</ul>
