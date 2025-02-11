<script lang="ts">
    import { page } from '$app/state';
    import { Icon, IconButton } from '~/lib/components';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import { createTeamMetadataQuery } from './utils';

    const { projectId }: { projectId: string } = $props();

    const query = createTeamMetadataQuery(() => ({ projectId }));
</script>

<div
    class="flex-1 border border-base-border-3 rounded-md shadow-sm p-4 dark:bg-base-3"
    class:opacity-50={$query.data != null && $query.data.count === 0}
>
    <div class="flex justify-between items-center gap-4">
        <h2 class="text-p text-base-fg-2">Teams</h2>
        <IconButton
            as="link"
            href="/{page.params.path}/projects/{page.params.identifier}/issues"
            variant="base"
        >
            <Icon name="arrow-right" class="size-4" />
        </IconButton>
    </div>
    <div class:animate-pulse={$query.isFetching} class="relative text-base-fg-1 text-h2 font-bold">
        {#if $query.isLoading}
            <Spinner2 class="absolute size-5 left-0 top-1/2 translate-x-1/2 -translate-y-1/2" />
        {/if}
        <p
            aria-hidden={$query.data == null ? true : undefined}
            class:invisible={$query.data == null}
        >
            {$query.data?.count ?? 0}
        </p>
    </div>
</div>
