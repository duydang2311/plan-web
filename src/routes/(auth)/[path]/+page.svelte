<script lang="ts">
    import { page } from '$app/state';
    import { Main } from '~/lib/components';
    import { IconProjectOutline, IconResourcesOutline } from '~/lib/components/icons';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { PageProps } from './$types';

    const { data }: PageProps = $props();
    const getAnalyticsRef = createRef.maybePromise(() => data.getAnalytics);
    const analytics = $derived(getAnalyticsRef.value?.ok ? getAnalyticsRef.value.data : null);
</script>

{#snippet card(label: string, value: number)}
    <div class="border-base-border-3 shadow-xs bg-base-1 dark:bg-base-2 rounded-lg border p-4">
        <p class="text-base-fg-4 font-display font-medium capitalize">{label}</p>
        <p class="text-base-fg-1 font-display mt-1 text-4xl font-black">
            {value}
        </p>
    </div>
{/snippet}

<Main class="bg-base-2 dark:bg-base-1">
    <h1 class="font-h-bold">{data.workspace.name}</h1>
    <div class="mt-4 grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-4">
        {@render card('Total projects', analytics?.totalProjects ?? 0)}
        {@render card('Active tasks', analytics?.activeIssues ?? 0)}
        {@render card('Total members', analytics?.totalMembers ?? 0)}
        {@render card('Due this week', analytics?.issuesDueThisWeek ?? 0)}
    </div>
    <div class="mt-4 grid grid-cols-[repeat(auto-fill,minmax(32rem,1fr))] gap-4">
        <a
            href="/{page.params.path}/projects"
            class="bg-base-1 border-base-border-3 flex h-40 content-center items-center justify-center gap-8 rounded-lg border p-4 shadow-xs"
        >
            <h2 class="font-h-bold">View projects</h2>
            <IconProjectOutline class="size-12" />
        </a>
        <a
            href="/{page.params.path}/resources"
            class="bg-base-1 border-base-border-3 flex h-40 content-center items-center justify-center gap-8 rounded-lg border p-4 shadow-xs"
        >
            <h2 class="font-h-bold">View resources</h2>
            <IconResourcesOutline class="size-12" />
        </a>
    </div>
</Main>
