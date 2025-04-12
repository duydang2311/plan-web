<script lang="ts">
    import { page } from '$app/state';
    import { Await, Button, Input } from '~/lib/components';
    import { IconPlus, IconSearch } from '~/lib/components/icons';
    import type { PageData } from './$types';
    import ProjectTable from './ProjectTable.svelte';

    const { data }: { data: PageData } = $props();
</script>

<main class="grid h-full grid-rows-[auto_1fr] content-start overflow-auto">
    <div class="border-b-base-border-2 flex justify-between border-b divide-x divide-base-border-3">
        <div class="relative pl-8 grow">
            <Input
                id="search"
                type="text"
                class="border-none py-1 pl-8 shadow-none bg-transparent h-full w-full"
                placeholder="Search by name"
            />
            <IconSearch
                class="text-base-fg-ghost absolute left-8 top-1/2 -translate-y-1/2"
            />
        </div>
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
    </div>
    <Await resolve={data.projectList}>
        {#snippet children({ value, loading })}
            <ProjectTable projectList={value} {loading} />
        {/snippet}
    </Await>
</main>
