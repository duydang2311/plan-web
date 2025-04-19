<script lang="ts">
    import { page } from '$app/state';
    import { Await, Button, Input } from '~/lib/components';
    import { IconPlus, IconSearch } from '~/lib/components/icons';
    import type { PageData } from './$types';
    import ProjectTable from './ProjectTable.svelte';
    import { createRef } from '~/lib/utils/runes.svelte';
    import { permissions } from '~/lib/models/permission';

    const { data }: { data: PageData } = $props();
    const getPermissionsRef = createRef.maybePromise(() => data.getPermissions);
    const can = $derived({
        createProject:
            getPermissionsRef.value?.ok === true &&
            getPermissionsRef.value.data.has(permissions.createProject),
        deleteProject:
            getPermissionsRef.value?.ok === true &&
            getPermissionsRef.value.data.has(permissions.deleteProject)
    });
</script>

<main class="grid h-full grid-rows-[auto_1fr] content-start overflow-auto">
    <div
        class="border-b-base-border-2 divide-base-border-3 flex justify-between divide-x border-b *:first:pl-8 *:last:pr-8"
    >
        <div class="relative grow pl-8">
            <Input
                id="search"
                type="text"
                class="h-full w-full border-none bg-transparent pl-8 shadow-none"
                placeholder="Search by name"
            />
            <IconSearch class="text-base-fg-ghost absolute left-8 top-1/2 -translate-y-1/2" />
        </div>
        {#if can.createProject}
            <Button
                as="link"
                href="/{page.params['path']}/projects/new"
                variant="base"
                flat
                filled={false}
                size="sm"
                class="flex w-fit items-center gap-2 pr-8"
            >
                <IconPlus />
                Create Project
            </Button>
        {/if}
    </div>
    <Await resolve={data.projectList}>
        {#snippet children({ value, loading })}
            <ProjectTable projectList={value} {loading} canDeleteProject={can.deleteProject} />
        {/snippet}
    </Await>
</main>
