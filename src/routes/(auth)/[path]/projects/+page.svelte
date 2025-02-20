<script lang="ts">
    import { page } from '$app/state';
    import { Await, Button, Input } from '~/lib/components';
    import { IconPlus, IconSearch } from '~/lib/components/icons';
    import type { PageData } from './$types';
    import ProjectTable from './ProjectTable.svelte';

    const { data }: { data: PageData } = $props();
</script>

<main class="grid h-full grid-rows-[auto_1fr] content-start overflow-auto">
    <div class="border-b-base-border-2 flex justify-between border-b px-4 py-1">
        <div class="relative">
            <Input
                id="search"
                type="text"
                class="w-48 border-none py-1 pl-8 shadow-none focus:ring-0"
                placeholder="Search by name"
            />
            <IconSearch
                class="text-base-fg-ghost absolute left-0 top-1/2 -translate-y-1/2 translate-x-1/2"
            />
        </div>
        <Button
            as="link"
            href="/{page.params['path']}/projects/new"
            variant="primary"
            filled={false}
            size="sm"
            class="flex w-fit items-center gap-2"
        >
            <IconPlus />
            Create Project
        </Button>
    </div>
    <Await resolve={data.projectList}>
        {#snippet children({ value, loading })}
            <ProjectTable projectList={value} {loading} />
        {/snippet}
    </Await>
</main>
