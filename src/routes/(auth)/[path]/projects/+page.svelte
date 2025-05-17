<script lang="ts">
    import { page } from '$app/state';
    import { Button, Main, Pagination3 } from '~/lib/components';
    import { IconPlus } from '~/lib/components/icons';
    import { permissions } from '~/lib/models/permission';
    import { createRef } from '~/lib/utils/runes.svelte';
    import type { PageData } from './$types';
    import ProjectTable from './ProjectTable.svelte';
    import { createPagination } from '~/lib/utils/table.svelte';
    import { paginatedList } from '~/lib/models/paginatedList';

    const { data }: { data: PageData } = $props();
    const projectListRef = createRef.maybePromise(() => data.projectList);
    const workspacePermissionsRef = createRef.maybePromise(() => data.workspacePermissions);
    const can = $derived({
        create: workspacePermissionsRef.value?.has(permissions.createProject) ?? false,
        delete: workspacePermissionsRef.value?.has(permissions.deleteProject) ?? false
    });
    const pagination = createPagination({
        syncUrl: () => page.url,
        syncList: () => projectListRef.value ?? paginatedList()
    });
</script>

<Main>
    <div class="max-w-desktop mx-auto grid h-full grid-rows-[auto_minmax(24rem,1fr)_auto] gap-4">
        <div class="flex flex-wrap items-center justify-between gap-x-8 gap-y-4">
            <div>
                <h1>Projects</h1>
                <p class="c-label">Create, track, and own every project in your workspace.</p>
            </div>
            {#if can.create}
                <Button
                    as="link"
                    href="/{page.params['path']}/projects/new"
                    variant="primary"
                    class="flex items-center gap-2 max-sm:justify-center sm:w-fit"
                >
                    <IconPlus />
                    Create Project
                </Button>
            {/if}
        </div>
        <ProjectTable {projectListRef} canDelete={can.delete} />
        {#if projectListRef.value != null && projectListRef.value.items.length > 0}
            <Pagination3 {pagination}>
                {#snippet label({ from, to, totalCount })}
                    Showing <strong>{from}</strong> to <strong>{to}</strong> of
                    <strong>{totalCount}</strong> members.
                {/snippet}
            </Pagination3>
        {/if}
    </div>
</Main>
