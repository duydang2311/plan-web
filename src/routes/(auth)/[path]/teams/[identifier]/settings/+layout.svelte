<script lang="ts">
    import { page } from '$app/stores';
    import type { Snippet } from 'svelte';
    import Navigation from './Navigation.svelte';

    interface Props {
        children: Snippet;
    }

    const { children }: Props = $props();
    const rootPath = $derived(
        `/${$page.params['path']}/teams/${$page.params['identifier']}/settings`
    );
</script>

<div class="max-xl:grid max-xl:grid-rows-[auto_1fr] h-full xl:flex xl:h-full">
    <div
        class="
		max-xl:border-b max-xl:border-b-base-border max-xl:py-2 max-xl:px-6
        xl:border-r xl:border-r-base-border"
    >
        <Navigation
            items={[
                {
                    label: 'General',
                    href: rootPath,
                    icon: 'settings-outline',
                    activeIcon: 'settings'
                },
                {
                    label: 'Members',
                    href: `${rootPath}/members`,
                    icon: 'users',
                    activeIcon: 'users-solid'
                }
            ]}
        />
    </div>
    <div class="bg-base-2 max-xl:h-full xl:grow bg-transparent">
        {@render children()}
    </div>
</div>
