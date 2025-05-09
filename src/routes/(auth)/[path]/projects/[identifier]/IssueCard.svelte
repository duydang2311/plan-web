<script lang="ts">
    import { page } from '$app/state';
    import { IconButton } from '~/lib/components';
    import { IconArrowRight } from '~/lib/components/icons';
    import Spinner2 from '~/lib/components/Spinner2.svelte';
    import type { PaginatedList } from '~/lib/models/paginatedList';
    import type { Loading } from '~/lib/utils/runes.svelte';
    import type { LocalIssue } from './+page.server';

    const {
        issueList,
        loading
    }: { issueList: PaginatedList<LocalIssue> | undefined; loading: Loading } = $props();
</script>

<div class="border-base-border-3 dark:bg-base-3 shadow-xs flex-1 rounded-md border p-4">
    <div class="flex items-center justify-between gap-4">
        <p class="font-medium">Issues</p>
        <IconButton
            as="link"
            href="/{page.params.path}/projects/{page.params.identifier}/issues"
            variant="base"
        >
            <IconArrowRight class="size-4" />
        </IconButton>
    </div>
    <div class:animate-pulse={loading.immediate} class="text-base-fg-1 text-h2 relative font-bold">
        {#if loading.short}
            <Spinner2 class="absolute left-0 top-1/2 size-5 -translate-y-1/2 translate-x-1/2" />
        {/if}
        <p aria-hidden={issueList == null ? true : undefined} class:invisible={issueList == null}>
            {issueList?.totalCount ?? 0}
        </p>
    </div>
</div>
