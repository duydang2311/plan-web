<script lang="ts">
  import { beforeNavigate } from '$app/navigation';
  import { page } from '$app/stores';
  import type { IconName } from '~/lib/components/Icon.svelte';
  import NavigationItem from './NavigationItem.svelte';
  import gsap from 'gsap';
  import Flip from 'gsap/dist/Flip';
  import { browser } from '$app/environment';

  interface Props {
    items: {
      href: string;
      icon: IconName;
      activeIcon: IconName;
      label: string;
    }[];
  }

  const { items }: Props = $props();
  const pathname = $derived($page.url.pathname.split('/', 3).join('/'));
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
            duration: 0.4,
            ease: 'power3.inOut'
          });
        }
      });
    } else {
      complete.then(() => {
        if (activeBar) {
          gsap.from(activeBar!, { opacity: 0, scaleY: 0, duration: 0.2, ease: 'power2.inOut' });
        }
      });
    }
  });
</script>

<ul class="font-medium group text-sm">
  {#each items as { href, icon, activeIcon, label } (href)}
    {@const isActive = pathname === href}
    <NavigationItem {href} {isActive} {icon} {activeIcon} {label}>
      {#if isActive}
        <div
          bind:this={activeBar}
          class="active-bar absolute inset-y-2 -left-4 bg-base-fg-1 w-0.5"
          data-flip-id="active-bar"
        ></div>
      {/if}
    </NavigationItem>
  {/each}
</ul>
