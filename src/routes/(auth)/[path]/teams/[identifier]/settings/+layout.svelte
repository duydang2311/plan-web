<script lang="ts">
    import { page } from '$app/state';
    import type { Snippet } from 'svelte';
    import {
        IconSettings,
        IconSettingsOutline,
        IconUsers,
        IconUsersSolid
    } from '~/lib/components/icons';
    import Navigation from './Navigation.svelte';

    interface Props {
        children: Snippet;
    }

    const { children }: Props = $props();
    const rootPath = $derived(
        `/${page.params['path']}/teams/${page.params['identifier']}/settings`
    );
</script>

<div class="h-full max-xl:grid max-xl:grid-rows-[auto_1fr] xl:flex xl:h-full">
    <div
        class="
		max-xl:border-b-base-border-2 xl:border-r-base-border-2 max-xl:border-b max-xl:px-6
        max-xl:py-2 xl:border-r"
    >
        <Navigation
            items={[
                {
                    label: 'General',
                    href: rootPath,
                    icon: IconSettingsOutline,
                    activeIcon: IconSettings
                },
                {
                    label: 'Members',
                    href: `${rootPath}/members`,
                    icon: IconUsers,
                    activeIcon: IconUsersSolid
                }
            ]}
        />
    </div>
    <div class="grow overflow-hidden max-xl:h-full">
        {@render children()}
    </div>
</div>
