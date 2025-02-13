<script lang="ts">
    import { page } from '$app/state';
    import { Icon, IconButton } from '~/lib/components';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import type { Metadata } from '~/lib/models/metadata';
    import type { Loading } from '~/lib/utils/runes.svelte';

    const { metadata, loading }: { metadata: Metadata | undefined; loading: Loading } = $props();
</script>

<div class="border-base-border-3 dark:bg-base-3 flex-1 rounded-md border p-4 shadow-xs">
    <div class="flex items-center justify-between gap-4">
        <h2 class="text-p text-base-fg-2">Members</h2>
        <IconButton
            as="link"
            href="/{page.params.path}/projects/{page.params.identifier}/members"
            variant="base"
        >
            <Icon name="arrow-right" class="size-4" />
        </IconButton>
    </div>
    <div class:animate-pulse={loading.immediate} class="text-base-fg-1 text-h2 relative font-bold">
        {#if loading.short}
            <Spinner2 class="absolute top-1/2 left-0 size-5 -translate-y-1/2 translate-x-1/2" />
        {/if}
        <p aria-hidden={metadata == null ? true : undefined} class:invisible={metadata == null}>
            {metadata?.count ?? 0}
        </p>
    </div>
</div>
